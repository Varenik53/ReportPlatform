# Web Service

`@reportplatform/web` — React-приложение для работы с платформой отчетов.

## Ответственность

- отображает список доступных отчетов;
- предоставляет форму запуска отчета;
- показывает список запусков и их статусы;
- позволяет скачать результат после успешной генерации.

## Локальный запуск

Из корня репозитория:

```bash
pnpm --filter @reportplatform/web dev
```

Интерфейс доступен на `http://localhost:3000`.

## Скрипты

- `pnpm --filter @reportplatform/web dev` — запуск Vite dev-сервера;
- `pnpm --filter @reportplatform/web build` — production-сборка;
- `pnpm --filter @reportplatform/web preview` — локальный preview сборки;
- `pnpm --filter @reportplatform/web test` — запуск тестов;
- `pnpm --filter @reportplatform/web lint` — проверка eslint;
- `pnpm --filter @reportplatform/web typecheck` — проверка типов TypeScript.
