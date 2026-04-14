FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY packages ./packages

RUN pnpm install
RUN pnpm --filter @reportplatform/web build

EXPOSE 3000

FROM nginx:1.27-alpine AS runtime

COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
