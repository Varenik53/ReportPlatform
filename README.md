# Report Platform

Прототип платформы отчетов для технического задания: запускать отчеты, обрабатывать их асинхронно, отслеживать статусы и скачивать результаты через веб-интерфейс.

## Цель

- Сделать архитектуру понятной и легко объяснимой.
- Обеспечить быстрый сценарий добавления нового отчета.
- Держать генерацию отчетов асинхронной через отдельный `worker`.
- Поддержать полный happy path: создать запуск -> отследить статус -> скачать файл.

## Быстрый старт

```bash
docker compose up --build
```

- Web UI: http://localhost:3000
- API: http://localhost:4000

## Структура репозитория

```text
packages/
  shared/   # общие типы и DTO
  reports/  # модули отчетов и реестр
  api/      # HTTP endpoint'ы жизненного цикла
  worker/   # фоновая асинхронная обработка
  web/      # React UI
```

## Целевой MVP API

```text
GET  /api/reports
POST /api/report-runs
GET  /api/report-runs
GET  /api/report-runs/:id
GET  /api/report-runs/:id/download
```

Для JSON endpoint'ов используется единый envelope:

```ts
{
  success: boolean;
  data?: unknown;
  error?: string;
}
```

## Текущий статус реализации

Уже реализовано:

- monorepo-структура (`pnpm workspaces`)
- пакеты: `web`, `api`, `worker`, `reports`, `shared`
- два зарегистрированных отчета: `sales-summary` (`xlsx`), `weather-brief` (`pdf`)
- bootstrap endpoint: `GET /reports`
- docker-compose окружение: `postgres`, `api`, `worker`, `web`

В работе до полного MVP:

- полный lifecycle endpoint'ов `report-runs`
- хранение `report_runs` в PostgreSQL
- реальная обработка запусков воркером и генерация артефактов
- download endpoint для готовых файлов

## Как добавить новый отчет

Можно использовать кодогенерацию:

```bash
pnpm --filter @reportplatform/reports report:new inventory-snapshot --formats xlsx
```

Параметры генератора:

- `--name "Inventory Snapshot"` — отображаемое имя отчета;
- `--description "..."` — описание отчета;
- `--formats xlsx,pdf` — поддерживаемые форматы.

Что делает команда:

- создает файл handler в `packages/reports/src/handlers/`;
- добавляет импорт handler в `packages/reports/src/registry/report-registry.ts`;
- добавляет handler в массив `reportHandlers` (то есть сразу регистрирует отчет для API и worker).

Пример результата в консоли:

```text
Result:
{
  "status": "ok",
  "reportKey": "inventory-snapshot",
  "handlerName": "inventorySnapshotHandler",
  "formats": ["xlsx"],
  "files": {
    "created": "src/handlers/inventory-snapshot.handler.ts",
    "updated": "src/registry/report-registry.ts"
  }
}
```

Для регистрации вручную:

1. Создать handler в `packages/reports/src/handlers/` (например, `inventory-snapshot.handler.ts`).
2. В handler описать:
   - `descriptor`: `key`, `name`, `description`, `formats`;
   - `generate(...)`: логику генерации и возврат артефакта.
3. Зарегистрировать handler в реестре `packages/reports/src/registry/report-registry.ts`:
   - добавить импорт нового handler;
   - добавить его в массив `reportHandlers`.

```ts
import { inventorySnapshotHandler } from "../handlers/inventory-snapshot.handler.js";

const reportHandlers: ReportHandler[] = [
  salesSummaryHandler,
  weatherBriefHandler,
  inventorySnapshotHandler,
];
```

4. Пересобрать/перезапустить сервисы (`api` и `worker`), чтобы они увидели новый модуль.
5. Проверить `GET /api/reports` — новый `descriptor.key` должен появиться в списке.
6. Запустить `POST /api/report-runs` с новым `reportKey` и убедиться, что run проходит async lifecycle (`queued` -> `running` -> `succeeded`) и файл доступен через `GET /api/report-runs/:id/download`.

## Разработка

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

Пояснения:

- `pnpm install` — устанавливает зависимости для всех пакетов монорепозитория.
- `pnpm dev` — поднимает все dev-процессы сразу (web, api, worker) в режиме разработки.
- `pnpm build` — собирает все пакеты в production-артефакты.
- `pnpm test` — запускает тесты по всему репозиторию.
- `pnpm lint` — проверяет код линтером и помогает поймать стилистические/потенциальные ошибки.
- `pnpm typecheck` — запускает проверку TypeScript-типов без выполнения кода.

Запуск по пакетам:

```bash
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```

Когда удобно запускать по отдельности:

- `pnpm dev:api` — только HTTP API (удобно при работе с endpoint'ами и контрактами).
- `pnpm dev:worker` — только воркер асинхронной обработки (удобно при отладке генерации отчетов и статусов run'ов).
- `pnpm dev:web` — только фронтенд (удобно при разработке интерфейса без перезапуска backend-процессов).
