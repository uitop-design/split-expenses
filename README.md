# Split Expenses

Split shared expenses within a group — a trip, a shared flat, a dinner with friends — and settle up
with the fewest possible transfers. Create a group, add members and expenses (split equally or by
exact amounts), and the app shows every member's balance together with a short list of
"who pays whom how much".

## Stack

| Layer    | Technologies                                                                                   |
| -------- | ---------------------------------------------------------------------------------------------- |
| API      | Node.js 24, TypeScript (strict), NestJS 12 (ESM), Prisma 7 + `@prisma/adapter-pg`, PostgreSQL 18 |
| Validation | Zod 4 via `nestjs-zod`, env validated with `@nestjs/config` + Zod                            |
| Docs     | Swagger UI at `/docs`                                                                          |
| Web      | Vite, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, react-hook-form + Zod, React Router, sonner, lucide-react |
| Tooling  | npm workspaces, Biome (lint + format), Jest + ts-jest (API unit tests)                         |
| Runtime  | Docker Compose: nginx (web), api, postgres, one-off migrate + seed                             |

## Monorepo layout

```
.
├── apps/
│   ├── api/                    NestJS REST API
│   │   ├── prisma/             schema, migrations, idempotent seed
│   │   └── src/
│   │       ├── config/         env schema and typed config service
│   │       ├── prisma/         PrismaClient with the pg driver adapter
│   │       ├── common/         error filter, validation pipe, shared schemas
│   │       ├── groups/         groups CRUD
│   │       ├── members/        adding and removing members
│   │       ├── expenses/       expenses and the split logic (split.ts)
│   │       ├── settlements/    recorded transfers between members
│   │       ├── balances/       balances and suggested transfers (balance-calculator.ts)
│   │       └── health/         liveness with a database check
│   └── web/                    React SPA
│       └── src/
│           ├── api/            fetch client, response schemas, TanStack Query hooks
│           ├── components/     ui/ (shadcn) and app components
│           ├── pages/          groups list, group page, not found
│           └── lib/            money and date formatting, helpers
├── biome.json
├── docker-compose.yml
└── package.json                workspaces and root scripts
```

## Data model

| Table            | Columns                                                                                      |
| ---------------- | -------------------------------------------------------------------------------------------- |
| `groups`         | `id` (uuid), `name`, `currency` (ISO 4217, default `UAH`), `created_at`, `updated_at`        |
| `members`        | `id`, `group_id` → groups (cascade), `name` (unique per group, case-insensitive), `created_at` |
| `expenses`       | `id`, `group_id` → groups (cascade), `description`, `amount`, `paid_by_id` → members, `spent_at` (date), `created_at` |
| `expense_shares` | `expense_id` → expenses (cascade) + `member_id` → members (composite PK), `amount`           |
| `settlements`    | `id`, `group_id` → groups (cascade), `from_member_id`, `to_member_id`, `amount`, `created_at` |

All money is stored as integers in minor currency units (kopecks, cents). The database also enforces
positive amounts, `from_member_id <> to_member_id`, the currency format and a unique index on
`(group_id, lower(name))`. Formatting into a currency happens only in the browser via
`Intl.NumberFormat`.

## Business rules

- Group name: 2–64 characters; member name: 1–32 characters after trimming; description: 1–120.
- A group is created with 2–20 members and can have at most 20.
- `amount` is an integer from 1 to 100 000 000 (up to 1 000 000.00 in the group currency).
- `spentAt` is a `YYYY-MM-DD` date between 2000-01-01 and today. "Today" is taken in the
  earliest time zone (UTC+14), so a user anywhere in the world can record an expense for their
  local date.
- Every member referenced by an expense or settlement must belong to the group, otherwise `400`.
  The payer does not have to take part in the split.
- A member can be removed only if they have no expenses, shares or settlements (`409` otherwise).
- Settlements require `from ≠ to` and a positive amount. Overpaying is allowed — the balance simply
  moves to the other side.

### Splitting

- **equal** — `{ "type": "equal", "memberIds": [...] }`. The amount is divided evenly between the
  listed members (no duplicates, at least one). Leftover minor units are handed out one by one to
  the first members in the order of `memberIds`, so the shares always add up to the amount exactly:
  `100` split between three members is `34 / 33 / 33`. The amount must be at least one minor unit
  per member.
- **exact** — `{ "type": "exact", "shares": [{ "memberId", "amount" }] }`. Every share is positive,
  members are not repeated, and the shares must add up to the amount exactly.

### Balances and transfers

```
balance = paid − own shares + sent settlements − received settlements
```

A positive balance means the group owes the member, a negative one means the member owes the
group. Balances of a group always add up to zero.

Suggested transfers are built greedily: the largest debtor pays the largest creditor the smaller of
the two amounts, then the step repeats until every balance is zero. Each step settles at least one
member completely, so there are never more than `n − 1` transfers for `n` members. Ties are broken
by member name (then id), which makes the result deterministic. Recording a suggested transfer as a
settlement removes it from the list.

## API

All endpoints are served under `/api`; errors share one format:

```json
{ "statusCode": 400, "error": "Bad Request", "message": ["amount: Too small"], "path": "/api/groups/…/expenses", "timestamp": "2026-11-13T12:00:00.000Z" }
```

Validation errors return `400` with a list of messages, unique conflicts `409`, missing records
`404`, broken references `400`; unexpected errors return `500` without details.

| Method   | Path                                       | Description                                              |
| -------- | ------------------------------------------ | -------------------------------------------------------- |
| `POST`   | `/groups`                                  | Create a group: `{ name, currency?, members: string[] }` |
| `GET`    | `/groups`                                  | List groups, newest first, with `membersCount` and `totalSpent` |
| `GET`    | `/groups/:id`                              | Group with members                                       |
| `PATCH`  | `/groups/:id`                              | Rename: `{ name }`                                       |
| `DELETE` | `/groups/:id`                              | Delete with all members, expenses and settlements (`204`) |
| `POST`   | `/groups/:id/members`                      | Add a member: `{ name }`                                 |
| `DELETE` | `/groups/:id/members/:memberId`            | Remove a member without history (`204`, `409` otherwise) |
| `GET`    | `/groups/:id/expenses?page=1&limit=20`     | Expenses with shares, newest first; `limit` ≤ 100         |
| `POST`   | `/groups/:id/expenses`                     | `{ description, amount, paidById, spentAt, split }`      |
| `DELETE` | `/groups/:id/expenses/:expenseId`          | Delete an expense (`204`)                                |
| `POST`   | `/groups/:id/settlements`                  | Record a transfer: `{ fromMemberId, toMemberId, amount }` |
| `GET`    | `/groups/:id/settlements`                  | Settlements, newest first                                |
| `GET`    | `/groups/:id/balances`                     | `{ balances: [{ memberId, name, balance }], transfers: [{ fromMemberId, toMemberId, amount }] }` |
| `GET`    | `/health`                                  | `{ status: "ok", checks: { postgres: "up" } }`           |

Interactive documentation: <http://localhost:3701/docs> (OpenAPI JSON at `/docs-json`).

## Running with Docker Compose

```bash
docker compose up -d --build
```

| Service    | URL / port                                   |
| ---------- | -------------------------------------------- |
| web        | <http://localhost:3700> (nginx, proxies `/api`) |
| api        | <http://localhost:3701/api>, Swagger at <http://localhost:3701/docs> |
| postgres   | `localhost:5440`, user / password / db: `split` / `split` / `split_expenses` |

The one-off `migrate` service applies migrations and runs the seed before the API starts. The seed
is idempotent: it creates "Trip to Carpathians" (4 members, 10 expenses, one settlement) and
"Flat 12" (3 members) only if they do not exist yet. To start over with a clean database:

```bash
docker compose down -v && docker compose up -d --build
```

## Running locally

Requirements: Node.js 22.22+ and a PostgreSQL instance (for example the one from Compose:
`docker compose up -d postgres`).

```bash
npm install                                   # installs both workspaces from the root
cp apps/api/.env.example apps/api/.env        # DATABASE_URL points to localhost:5440
npm run db:migrate -w apps/api                # prisma migrate deploy
npm run db:seed -w apps/api                   # idempotent seed
npm run dev                                   # api on :3701 and web on :5173
```

The Vite dev server proxies `/api` to `http://localhost:3701`, so open <http://localhost:5173>.

## Scripts

Run from the repository root:

| Script              | Description                                         |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | API (watch mode) and web dev server in parallel     |
| `npm run build`     | Build both workspaces                               |
| `npm run typecheck` | Type-check both workspaces                          |
| `npm run lint`      | Biome lint and format check for the whole monorepo  |
| `npm run format`    | Apply Biome fixes and formatting                    |
| `npm test`          | API unit tests (Jest, Prisma is mocked)             |

The unit tests cover the split logic, balance and transfer calculation, expense creation,
member removal and the exception filter; they do not need a database.
