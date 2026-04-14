FROM node:20-alpine

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY packages ./packages

RUN pnpm install
RUN pnpm build

EXPOSE 4000

CMD ["pnpm", "--filter", "@reportplatform/api", "start"]
