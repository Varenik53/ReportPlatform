# API Service

`@reportplatform/api` — NestJS HTTP API для жизненного цикла запусков отчетов.

## Ответственность

- предоставляет REST endpoint'ы платформы отчетов;
- валидирует входные данные запросов;
- создает и читает сущности запусков отчетов;
- отдает результат генерации через endpoint скачивания.

## Локальный запуск

Из корня репозитория:

```bash
pnpm --filter @reportplatform/api dev
```

## Скрипты

- `pnpm --filter @reportplatform/api dev` — запуск в режиме разработки;
- `pnpm --filter @reportplatform/api build` — сборка TypeScript в `dist`;
- `pnpm --filter @reportplatform/api start` — запуск собранного сервиса;
- `pnpm --filter @reportplatform/api test` — запуск тестов;
- `pnpm --filter @reportplatform/api lint` — проверка eslint;
- `pnpm --filter @reportplatform/api typecheck` — проверка типов.

## Зависимости

- `@reportplatform/shared` — общие типы, DTO и утилиты;
- `@reportplatform/reports` — реестр и контракты отчетов.
- `@nestjs/*` — фреймворк NestJS для модульной структуры API.
