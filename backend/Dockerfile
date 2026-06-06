FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

FROM base AS build
COPY . .
RUN pnpm run build

FROM node:20-alpine AS production
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
