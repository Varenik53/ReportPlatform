FROM node:20-alpine AS build

WORKDIR /app

RUN corepack enable

# Root "prepare" runs husky; .git is not in the image — skip git hooks during install.
ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY packages ./packages

RUN pnpm install --frozen-lockfile
# @reportplatform/shared exports ./dist; must be built before Vite can bundle the web app.
RUN pnpm --filter @reportplatform/shared build && pnpm --filter @reportplatform/web build

EXPOSE 3000

FROM nginx:1.27-alpine AS runtime

COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/packages/web/dist /usr/share/nginx/html

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]
