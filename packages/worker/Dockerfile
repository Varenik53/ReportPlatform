FROM node:20-alpine

WORKDIR /app

RUN corepack enable

ENV HUSKY=0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY packages ./packages

RUN pnpm install
RUN pnpm build

CMD ["pnpm", "--filter", "@reportplatform/worker", "start"]
