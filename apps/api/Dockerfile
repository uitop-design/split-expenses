# syntax=docker/dockerfile:1

FROM node:24-alpine AS base
WORKDIR /app
ENV PRISMA_HIDE_UPDATE_MESSAGE=1
COPY package.json package-lock.json .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/

FROM base AS deps
RUN npm ci -w apps/api

FROM deps AS build
COPY apps/api apps/api
RUN DATABASE_URL=postgresql://build:build@localhost:5432/build npm run build -w apps/api

FROM build AS migrator
WORKDIR /app/apps/api
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed"]

FROM base AS prod-deps
RUN npm ci -w apps/api --omit=dev && npm cache clean --force

FROM node:24-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app ./
COPY --from=build /app/apps/api/dist apps/api/dist
WORKDIR /app/apps/api
USER node
EXPOSE 3701
CMD ["node", "dist/main.js"]
