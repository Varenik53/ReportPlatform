# Reports Module

`@reportplatform/reports` — пакет с модулями отчетов и их реестром.

## Ответственность

- хранит описание доступных отчетов (метаданные и поддерживаемые форматы);
- содержит контракты и интерфейсы для генерации;
- реализует конкретные обработчики отчетов;
- предоставляет единый реестр для API и Worker.

## Текущая структура

```text
src/
  contracts/ # контракты report handler'ов
  handlers/  # модули конкретных отчетов
  registry/  # реестр и поиск handler'ов
  services/  # общие сервисы для report-модулей
```

## Как добавить новый отчет

Быстрый путь (рекомендуется) — сгенерировать каркас:

```bash
pnpm --filter @reportplatform/reports report:new inventory-snapshot --formats xlsx
```

Что делает генератор:

- создает `src/handlers/inventory-snapshot.handler.ts`;
- добавляет импорт в `src/registry/report-registry.ts`;
- добавляет handler в массив `reportHandlers`.

Опции:

- `--name "Inventory Snapshot"` — отображаемое имя отчета;
- `--description "..."` — описание отчета;
- `--formats xlsx,pdf` — поддерживаемые форматы.

После генерации остается доработать `generate(...)` под реальную бизнес-логику.

Ручной путь:

1. Добавить новый обработчик в `src/handlers/` (например, `inventory-snapshot.handler.ts`).
2. Описать `descriptor`: `key`, `name`, `description`, `formats`.
3. Реализовать `generate(...)` и вернуть `ReportArtifact`.
4. Зарегистрировать обработчик в `src/registry/report-registry.ts`:
   - добавить импорт;
   - включить handler в массив `reportHandlers`.

```ts
import { inventorySnapshotHandler } from "../handlers/inventory-snapshot.handler.js";

const reportHandlers: ReportHandler[] = [
  salesSummaryHandler,
  weatherBriefHandler,
  inventorySnapshotHandler,
];
```

`GET /api/reports` использует `getReportDescriptors()` из этого реестра. Если handler не добавлен в `reportHandlers`, API не увидит новый отчет.

## Скрипты

- `pnpm --filter @reportplatform/reports dev` — watch-сборка TypeScript;
- `pnpm --filter @reportplatform/reports build` — сборка в `dist`;
- `pnpm --filter @reportplatform/reports test` — запуск тестов;
- `pnpm --filter @reportplatform/reports lint` — проверка eslint;
- `pnpm --filter @reportplatform/reports typecheck` — проверка типов.
