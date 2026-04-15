# Report Platform

Прототип платформы отчётов: запуск генерации, асинхронная обработка, отслеживание статусов, скачивание результатов через веб-интерфейс.

## Быстрый старт

```bash
docker compose up --build
```

- **Web UI:** http://localhost:3000
- **API:** http://localhost:4000

Таблицы создаются автоматически при первом старте PostgreSQL-контейнера через SQL-скрипты в `init-db/`.

> В продакшене инициализация схемы заменяется на полноценные миграции (например, через `node-pg-migrate` или `prisma migrate`). В MVP достаточно init-скриптов PostgreSQL.

## Структура репозитория

```text
packages/
  shared/    # общие типы, DTO, маппер, DB pool
  reports/   # контракт отчёта, реестр, модули отчётов, кодогенератор
  api/       # NestJS HTTP API (lifecycle и download)
  worker/    # polling очереди и выполнение отчётов
  web/       # React + Vite UI
```

## API

| Метод | Endpoint                        | Описание                   |
| ----- | ------------------------------- | -------------------------- |
| GET   | `/api/reports`                  | Список доступных отчётов   |
| POST  | `/api/report-runs`              | Создать запуск отчёта      |
| GET   | `/api/report-runs`              | Список запусков            |
| GET   | `/api/report-runs/:id`          | Статус конкретного запуска |
| GET   | `/api/report-runs/:id/download` | Скачать файл результата    |

JSON-ответы используют envelope `{ success, data?, error? }`. Download endpoint отдаёт файл напрямую; ошибки — тоже в JSON envelope.

## Как добавить новый отчёт

### Через кодогенератор

```bash
pnpm --filter @reportplatform/reports report:new inventory-snapshot --formats xlsx
```

Команда создаёт handler-файл и автоматически регистрирует его в реестре.

### Вручную

1. Создать файл handler в `packages/reports/src/handlers/` по контракту `ReportHandler`.
2. Описать `descriptor` (key, name, description, formats) и реализовать `generate(run)`.
3. Добавить handler в массив `reportHandlers` в `packages/reports/src/registry/report-registry.ts`.
4. Пересобрать сервисы. Новый отчёт появится в `GET /api/reports` и станет доступен для запуска.

Подробнее о контракте, потоке данных и архитектурных решениях — в [ARCHITECTURE.md](./ARCHITECTURE.md).

## Разработка (без Docker)

```bash
pnpm install        # зависимости всех пакетов
pnpm build          # сборка всех пакетов
pnpm dev            # dev-режим (web + api + worker параллельно)
pnpm test           # тесты
pnpm lint           # линтер
pnpm typecheck      # проверка типов
```

Для запуска отдельных пакетов:

```bash
pnpm dev:api        # только HTTP API
pnpm dev:worker     # только воркер
pnpm dev:web        # только фронтенд
```

При локальной разработке без Docker нужен работающий PostgreSQL с `DATABASE_URL` и переменная `STORAGE_DIR` (по умолчанию `./storage`).

## Переменные окружения

| Переменная                | Сервис     | По умолчанию | Описание                                  |
| ------------------------- | ---------- | ------------ | ----------------------------------------- |
| `DATABASE_URL`            | api/worker | —            | Connection string PostgreSQL (обязателен) |
| `PORT`                    | api        | `4000`       | Порт HTTP API                             |
| `STORAGE_DIR`             | api/worker | `./storage`  | Директория для сгенерированных файлов     |
| `WORKER_POLL_INTERVAL_MS` | worker     | `5000`       | Интервал polling очереди (мс)             |
