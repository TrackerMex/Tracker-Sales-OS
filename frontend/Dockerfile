FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@10.33.4 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install

FROM base AS development
COPY . .
EXPOSE 5173
CMD ["pnpm", "run", "dev", "--host"]

FROM base AS build
COPY . .
RUN pnpm run build

FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
