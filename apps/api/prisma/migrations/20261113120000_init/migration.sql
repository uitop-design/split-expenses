-- CreateTable
CREATE TABLE "groups" (
    "id" UUID NOT NULL,
    "name" VARCHAR(64) NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'UAH',
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "description" VARCHAR(120) NOT NULL,
    "amount" INTEGER NOT NULL,
    "paid_by_id" UUID NOT NULL,
    "spent_at" DATE NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_shares" (
    "expense_id" UUID NOT NULL,
    "member_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "expense_shares_pkey" PRIMARY KEY ("expense_id","member_id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "from_member_id" UUID NOT NULL,
    "to_member_id" UUID NOT NULL,
    "amount" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "groups_created_at_idx" ON "groups"("created_at");

-- CreateIndex
CREATE INDEX "members_group_id_idx" ON "members"("group_id");

-- CreateIndex
CREATE INDEX "expenses_group_id_spent_at_created_at_idx" ON "expenses"("group_id", "spent_at" DESC, "created_at" DESC);

-- CreateIndex
CREATE INDEX "expenses_paid_by_id_idx" ON "expenses"("paid_by_id");

-- CreateIndex
CREATE INDEX "expense_shares_member_id_idx" ON "expense_shares"("member_id");

-- CreateIndex
CREATE INDEX "settlements_group_id_created_at_idx" ON "settlements"("group_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "settlements_from_member_id_idx" ON "settlements"("from_member_id");

-- CreateIndex
CREATE INDEX "settlements_to_member_id_idx" ON "settlements"("to_member_id");

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paid_by_id_fkey" FOREIGN KEY ("paid_by_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_expense_id_fkey" FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_from_member_id_fkey" FOREIGN KEY ("from_member_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_to_member_id_fkey" FOREIGN KEY ("to_member_id") REFERENCES "members"("id") ON DELETE NO ACTION ON UPDATE CASCADE;


-- CreateIndex
CREATE UNIQUE INDEX "members_group_id_name_key" ON "members"("group_id", lower("name"));

-- AddCheckConstraint
ALTER TABLE "groups" ADD CONSTRAINT "groups_currency_check" CHECK ("currency" ~ '^[A-Z]{3}$');

-- AddCheckConstraint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_amount_check" CHECK ("amount" > 0);

-- AddCheckConstraint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_amount_check" CHECK ("amount" > 0);

-- AddCheckConstraint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_amount_check" CHECK ("amount" > 0);

-- AddCheckConstraint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_members_check" CHECK ("from_member_id" <> "to_member_id");
