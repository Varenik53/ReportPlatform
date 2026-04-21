FROM mcr.microsoft.com/playwright:v1.59.1-noble

WORKDIR /app

ENV HUSKY=0
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY packages ./packages
COPY e2e ./e2e
COPY playwright.config.ts ./

RUN pnpm install --frozen-lockfile

ENV PLAYWRIGHT_BASE_URL=http://web:3000

CMD ["pnpm", "exec", "playwright", "test"]
