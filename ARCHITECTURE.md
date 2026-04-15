# Architecture Document — Report Platform

**Версия:** 2.0.0
**Последнее обновление:** April 15, 2026

---

## 1. Контекст и цель

Прототип платформы отчётов. Бизнес-задача: от идеи до готового отчёта в продакшене — один рабочий день. Отчёты пишут разные разработчики, данные приходят из разных источников (БД, внешние API, файлы), форматы вывода тоже разные (XLSX, PDF, потенциально другие).

Прототип демонстрирует:

- асинхронную генерацию отчётов через отдельный worker
- API для полного lifecycle запуска: создание → отслеживание → скачивание
- web UI для работы с платформой
- паттерн быстрого добавления нового отчёта
- запуск одной командой `docker compose up --build`

## 2. Архитектурный стиль

**Модульный монолит** в pnpm monorepo с разделением runtime-ролей:

Схема ниже — обычный текст в блоке кода; её видно в любом просмотрщике Markdown (встроенный предпросмотр Cursor/VS Code **не рисует** диаграммы `mermaid` без расширения).

```text
          +-----------------+
          | web (React UI)  |
          +--------+--------+
                   | HTTP
                   v
          +--------+--------+       +----------------------+
          | api (NestJS)    |------>| PostgreSQL (metadata)|
          +--------+--------+       +----------------------+
                   ^
                   |
          +--------+--------+
          | worker (Node.js)|
          +--------+--------+
                   |
                   v
          +-----------------+
          | Shared volume   |
          | (files)         |
          +-----------------+
```

Не микросервисы: пакеты делят код через `@reportplatform/shared` и `@reportplatform/reports`, но запускаются как отдельные процессы с разными ролями.

## 3. Границы пакетов

| Пакет     | Зона ответственности                                                                                  |
| --------- | ----------------------------------------------------------------------------------------------------- |
| `shared`  | Типы, DTO, статусы, DB pool (`pg`), маппер строк, утилиты. Не зависит от runtime-пакетов.             |
| `reports` | Контракт `ReportHandler`, реестр отчётов, конкретные модули отчётов, кодогенератор.                   |
| `api`     | NestJS HTTP API: lifecycle endpoint'ы, валидация, стриминг файлов. Не содержит бизнес-логики отчётов. |
| `worker`  | Polling очереди из PostgreSQL, выполнение отчётов, запись файлов. Не содержит HTTP-логики.            |
| `web`     | React + Vite SPA: dashboard, форма запуска, список запусков, скачивание.                              |

Ключевое правило: **report-специфичная логика живёт только в `packages/reports`**. API и worker работают с отчётами через реестр и контракт, без ветвлений по типу отчёта.

## 4. Потоки данных

### 4.1. Список доступных отчётов

1. UI → `GET /api/reports`
2. API вызывает `getAvailableReports()` из `@reportplatform/reports` (читает descriptors из реестра)
3. UI получает массив `ReportDescriptor[]`

### 4.2. Создание запуска

1. UI → `POST /api/report-runs` с `{ reportKey, format, params }`
2. API валидирует: ключ известен, формат поддерживается отчётом, payload корректен
3. API создаёт запись в `report_runs` со статусом `queued`
4. UI получает созданный `ReportRun`

### 4.3. Асинхронная обработка (worker)

1. Worker раз в N мс вызывает `claimNextQueuedReportRun()` — `SELECT ... FOR UPDATE SKIP LOCKED` + `UPDATE status = 'running'`
2. Worker находит descriptor отчёта в реестре по `reportKey`
3. Worker генерирует файл и записывает его в shared volume (`STORAGE_DIR`)
4. Worker ставит `succeeded` (с `file_path`, `file_name`) или `failed` (с `error_message`)
5. Цикл повторяется, пока есть queued-записи

### 4.4. Отслеживание и скачивание

1. UI polling `GET /api/report-runs` каждые 5 секунд
2. При статусе `succeeded` UI показывает кнопку скачивания
3. Скачивание → `GET /api/report-runs/:id/download` → API стримит файл с path traversal protection

## 5. API-контракт

| Метод  | Endpoint                    | Описание                                   |
| ------ | --------------------------- | ------------------------------------------ |
| GET    | `/reports`                  | Список доступных отчётов                   |
| POST   | `/report-runs`              | Создать запуск (возвращает ReportRun)      |
| GET    | `/report-runs`              | Список запусков (ORDER BY created_at DESC) |
| GET    | `/report-runs/:id`          | Статус конкретного запуска                 |
| DELETE | `/report-runs/:id`          | Удалить запуск и связанный файл            |
| GET    | `/report-runs/:id/download` | Скачать файл результата                    |

Web UI обращается к `/api/...` — nginx (production) и Vite proxy (dev) перенаправляют на API с удалением префикса `/api`.

Envelope для всех JSON-ответов:

```ts
{ success: true,  data: { ... } }
{ success: false, error: "Человекочитаемое описание ошибки" }
```

## 6. Модель данных

Единственная таблица `report_runs`:

| Поле            | Тип           | Описание                                      |
| --------------- | ------------- | --------------------------------------------- |
| `id`            | `UUID`        | PK, генерируется на стороне API               |
| `report_key`    | `TEXT`        | Ключ отчёта из реестра                        |
| `format`        | `TEXT`        | Запрошенный формат (`xlsx`, `pdf`)            |
| `params_json`   | `JSONB`       | Параметры запуска                             |
| `status`        | `TEXT`        | `queued` / `running` / `succeeded` / `failed` |
| `created_at`    | `TIMESTAMPTZ` | Время создания запуска                        |
| `started_at`    | `TIMESTAMPTZ` | Время начала обработки воркером               |
| `finished_at`   | `TIMESTAMPTZ` | Время завершения                              |
| `file_path`     | `TEXT`        | Относительный путь к файлу в storage          |
| `file_name`     | `TEXT`        | Имя файла для скачивания                      |
| `error_message` | `TEXT`        | Сообщение об ошибке (при `failed`)            |

> В MVP таблица создаётся вручную (см. README). В продакшене — через инструмент миграций.

## 7. Контракт отчёта и шаблон добавления

### Контракт `ReportHandler`

```ts
interface ReportHandler {
  descriptor: ReportDescriptor; // key, name, description, formats
  generate(run: ReportRun): Promise<ReportArtifact>; // content + fileExtension
}
```

Каждый отчёт — отдельный файл в `packages/reports/src/handlers/`, экспортирующий объект `ReportHandler`.

### Пошаговая инструкция для разработчика

**Вариант A — кодогенератор:**

```bash
pnpm --filter @reportplatform/reports report:new inventory-snapshot --formats xlsx
```

Генератор создаёт handler-файл и автоматически добавляет импорт и регистрацию в реестр. Опции:

- `--name "Inventory Snapshot"` — отображаемое имя
- `--description "..."` — описание
- `--formats xlsx,pdf` — поддерживаемые форматы

**Вариант B — вручную:**

1. Создать `packages/reports/src/handlers/<key>.handler.ts`
2. Реализовать `ReportHandler`: descriptor с key/name/description/formats и метод `generate(run)`
3. Добавить импорт и handler в массив `reportHandlers` в `packages/reports/src/registry/report-registry.ts`
4. Пересобрать сервисы

**Проверка:**

- `GET /api/reports` — новый отчёт в списке
- `POST /api/report-runs` с новым `reportKey` — создаётся запуск
- Worker переводит запуск через `queued → running → succeeded`
- `GET /api/report-runs/:id/download` — файл скачивается

### Что обеспечивает быстрое добавление

- Весь report-специфичный код в одном файле handler'а
- Регистрация — одна строка в реестре (или автоматическая через генератор)
- API и worker не требуют изменений — они работают через реестр
- Кодогенератор автоматизирует scaffolding до одной команды в терминале

## 8. Ключевые решения и альтернативы

### Решение 1: Модульный монолит с разделением runtime

**Выбрано:** одна кодовая база (`pnpm workspaces`), отдельные runtime-процессы `api` и `worker`.

**Альтернативы:**

- Полные микросервисы — избыточная сложность для прототипа, требует service mesh / API gateway
- Всё в одном процессе — нет изоляции тяжёлой генерации от HTTP-запросов, один сбой роняет всё
- Синхронная генерация в API — блокирует HTTP-запросы, не масштабируется

**Почему выбрано:** монорепо даёт общий код без дупликации, разделение процессов обеспечивает асинхронность без тяжёлой инфраструктуры, а границы пакетов сохраняют возможность разнести компоненты в будущем.

### Решение 2: Паттерн report registry

**Выбрано:** реестр `ReportHandler[]` в `packages/reports`, API и worker адресуют отчёты по ключу.

**Альтернативы:**

- Switch/if ветвления в контроллерах API — плохо масштабируется, нарушает Open/Closed
- Plugin-система с динамической загрузкой — излишне сложно для MVP
- Конфигурация отчётов в БД — требует admin UI и усложняет деплой

**Почему выбрано:** добавление отчёта = один файл + одна строка регистрации. Нет нужды менять API или worker. Кодогенератор сводит это к одной команде.

### Решение 3: DB polling вместо очереди сообщений

**Выбрано:** worker опрашивает `report_runs` с `SELECT ... FOR UPDATE SKIP LOCKED`.

**Альтернативы:**

- BullMQ + Redis — надёжная очередь, retry-политики, но добавляет инфраструктуру
- RabbitMQ / Kafka — enterprise-уровень, избыточен для прототипа
- pg_notify — меньше polling, но сложнее обработка ошибок

**Почему выбрано:** PostgreSQL уже есть, `SKIP LOCKED` обеспечивает корректную работу при нескольких worker'ах, zero additional infrastructure. Миграция на BullMQ — замена одного модуля в worker.

### Решение 4: Shared volume для артефактов

**Выбрано:** Docker named volume `report-storage`, примонтированный к api и worker.

**Альтернативы:**

- S3/MinIO — production-ready, но усложняет локальный запуск
- Хранение в БД как BLOB — плохо масштабируется по размеру файлов
- Передача файла через очередь — ограничение по размеру, усложнение протокола

**Почему выбрано:** для MVP закрывает download flow без внешних зависимостей. Worker пишет файл, API стримит его клиенту. В продакшене volume заменяется на object storage.

### Решение 5: NestJS для API

**Выбрано:** NestJS с декораторами, DI и модульной структурой.

**Альтернативы:**

- Express напрямую — проще начать, но быстро обрастает boilerplate
- Fastify — быстрее, но экосистема декораторов менее развита

**Почему выбрано:** NestJS даёт структуру из коробки (controllers / services / modules), встроенный exception filter для единообразных ошибок, и хорошо ложится на будущее масштабирование API.

## 9. Осознанные упрощения в MVP

### Stub-генерация файлов

Текущие handler'ы и worker генерируют текстовый stub-контент с расширением `.xlsx` / `.pdf`, а не настоящие бинарные файлы. Это сделано осознанно:

- Фокус прототипа — на архитектуре, lifecycle и паттерне расширения, а не на библиотеках рендеринга
- Замена stub на реальную генерацию (exceljs, pdfkit и т.д.) — изменение только внутри `generate()` конкретного handler'а
- Остальная цепочка (API, worker, UI, download) работает одинаково для stub и real content

### Отсутствие автоматических миграций

Схема БД создаётся вручную (одна команда из README). В прототипе одна таблица, и отдельный инструмент миграций добавил бы сложность без пропорциональной пользы. В продакшене — обязательно.

### Worker не вызывает `generate()` из handler'ов

Текущий worker использует `buildStubReportContent()` напрямую, а не `handler.generate()`. Это промежуточное состояние: контракт `ReportHandler.generate` определён, handler'ы его реализуют, но worker пока не делегирует вызов через реестр. Переключение — замена нескольких строк в `report-run.processor.ts`.

## 10. Что не реализовано и почему

| Что                                | Почему не в MVP                                      | Что нужно для продакшена                                 |
| ---------------------------------- | ---------------------------------------------------- | -------------------------------------------------------- |
| Аутентификация и авторизация       | Прототип однопользовательский                        | JWT/OAuth2, ролевая модель, middleware                   |
| WebSocket / SSE для статусов       | Polling каждые 5 с достаточен для демо               | SSE или WebSocket push при смене статуса                 |
| Очередь сообщений (Redis/RabbitMQ) | DB polling достаточен для масштаба MVP               | BullMQ + Redis для retry, приоритетов, dead letter queue |
| Object storage (S3/MinIO)          | Shared volume работает в docker compose              | S3-compatible storage с presigned URLs                   |
| Реальная генерация XLSX/PDF        | Фокус на архитектуре, а не на библиотеках рендеринга | exceljs / pdfkit / puppeteer внутри handler.generate()   |
| CI/CD pipeline                     | Локальная разработка, docker compose                 | GitHub Actions: lint, test, typecheck, build, deploy     |
| Structured logging и мониторинг    | console.log достаточен для прототипа                 | pino / winston, OpenTelemetry, Prometheus, Grafana       |
| Фильтрация API                     | Список ограничен 200 записями                        | cursor-based pagination, фильтры по status/reportKey     |

## 11. Production roadmap

1. **Очередь задач:** заменить DB polling на BullMQ + Redis (retry-политики, приоритеты, dead letter)
2. **Object storage:** перенести артефакты в S3/MinIO, отдавать через presigned URL
3. **Миграции:** добавить инструмент миграций, запускать в CI
4. **Auth:** JWT/OAuth2, ролевая модель, защита endpoint'ов
5. **Observability:** structured logging (pino), traces (OpenTelemetry), метрики, alerting
6. **CI/CD:** lint + test + typecheck + build + deploy pipeline
7. **Push-уведомления:** SSE/WebSocket вместо polling для обновления статусов в UI
