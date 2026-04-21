# Report Platform

Прототип платформы отчётов: запуск генерации, асинхронная обработка, отслеживание статусов, скачивание результатов через веб-интерфейс.

## Быстрый старт

```bash
docker compose up --build
```

- **Web UI:** http://localhost:3000
- **API:** http://localhost:4000

E2E (Playwright) вынесены в отдельный сервис Compose с профилем `e2e`; см. раздел [E2E-тесты](#e2e-тесты).

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

## Тесты

### Unit-тесты

```bash
# Запустить все unit-тесты
pnpm test

# Запустить тесты одного пакета
pnpm --filter @reportplatform/api test
pnpm --filter @reportplatform/worker test
pnpm --filter @reportplatform/reports test
```

Тесты используют **Vitest** и запускаются без реальной БД и файловой системы (используются моки).

### E2E-тесты

E2E-тесты используют **Playwright** и проверяют полный поток: создание запуска, ожидание обработки, скачивание файла.

**Через Docker (рекомендуется для проверки как в CI):** приложение и тесты в одной сети Compose, базовый URL для браузера — `http://web:3000`. Зависимости (`postgres`, `api`, `worker`, `web`) поднимутся сами, если ещё не запущены.

```bash
pnpm docker:e2e
```

**Локально** (браузер на хосте, UI по умолчанию `http://127.0.0.1:3000`):

```bash
docker compose up --build
pnpm test:e2e
```

Переопределить базовый URL: задайте `PLAYWRIGHT_BASE_URL` (см. таблицу переменных ниже).

### CI проверки

```bash
# Запустить все проверки как в CI: тесты + e2e
pnpm test:ci

# Дополнительно: lint и typecheck
pnpm lint
pnpm typecheck
```

## Сообщения коммитов (Conventional Commits)

Для сообщений коммитов используется соглашение [Conventional Commits](https://www.conventionalcommits.org/): краткое описание изменения в фиксированном формате, чтобы по истории было видно тип правки и при необходимости автоматизировать changelog и версионирование.

**Формат одной строки:**

```text
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Частые типы `type`:** `feat` — новая функциональность, `fix` — исправление бага, `docs` — только документация, `refactor` — рефакторинг без смены поведения, `test` — тесты, `chore` — сопутствующие задачи (сборка, зависимости и т.п.).

**Примеры:**

```text
feat(api): добавить фильтр по статусу в списке запусков
fix(worker): корректно обновлять статус при ошибке рендера
docs: описать Conventional Commits в README
```

При необходимости указывайте breaking changes в теле коммита или с префиксом `BREAKING CHANGE:` в footer согласно спецификации по ссылке выше.

## Переменные окружения

| Переменная                | Сервис           | По умолчанию            | Описание                                                                             |
| ------------------------- | ---------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL`            | api/worker       | —                       | Connection string PostgreSQL (обязателен)                                            |
| `PORT`                    | api              | `4000`                  | Порт HTTP API                                                                        |
| `STORAGE_DIR`             | api/worker       | `./storage`             | Директория для сгенерированных файлов                                                |
| `WORKER_POLL_INTERVAL_MS` | worker           | `5000`                  | Интервал polling очереди (мс)                                                        |
| `PLAYWRIGHT_BASE_URL`     | e2e (Playwright) | `http://127.0.0.1:3000` | Базовый URL UI при прогоне E2E; в сервисе `e2e` в compose задаётся `http://web:3000` |
