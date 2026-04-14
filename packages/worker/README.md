# Worker Service

`@reportplatform/worker` — фоновый воркер для асинхронной генерации отчетов.

## Ответственность

- забирает запуски отчетов со статусом ожидания;
- выполняет генерацию отчета через модуль `reports`;
- сохраняет итоговые артефакты;
- обновляет статусы выполнения (`queued`, `running`, `succeeded`, `failed`).

## Локальный запуск

Из корня репозитория:

```bash
pnpm --filter @reportplatform/worker dev
```

## Скрипты

- `pnpm --filter @reportplatform/worker dev` — запуск в режиме разработки;
- `pnpm --filter @reportplatform/worker build` — сборка TypeScript в `dist`;
- `pnpm --filter @reportplatform/worker start` — запуск собранного воркера;
- `pnpm --filter @reportplatform/worker test` — запуск тестов;
- `pnpm --filter @reportplatform/worker lint` — проверка eslint;
- `pnpm --filter @reportplatform/worker typecheck` — проверка типов.

## Зависимости

- `@reportplatform/shared` — общие типы и утилиты;
- `@reportplatform/reports` — реестр отчетов и обработчики генерации.
