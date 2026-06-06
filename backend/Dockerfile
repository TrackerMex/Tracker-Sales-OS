FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install

FROM base AS development
COPY . .
EXPOSE 3000
CMD ["pnpm", "run", "start:dev"]

FROM base AS build
COPY . .
RUN pnpm run build

FROM node:22-alpine AS production
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --prod
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
