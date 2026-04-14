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

1. Добавить модуль отчета в `packages/reports/src/handlers/`.
2. Описать `descriptor` (`key`, `name`, `description`, `formats`) и `generate(...)`.
3. Зарегистрировать модуль в реестре отчетов.
4. Проверить, что отчет появился в `GET /api/reports`.
5. Проверить, что запуск проходит async lifecycle и становится доступным для скачивания.

## Разработка

```bash
pnpm install
pnpm dev
pnpm build
pnpm test
pnpm lint
pnpm typecheck
```

Запуск по пакетам:

```bash
pnpm dev:api
pnpm dev:worker
pnpm dev:web
```
