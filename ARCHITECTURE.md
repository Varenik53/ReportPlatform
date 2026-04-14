# Architecture Document - Report Platform

**Версия:** 1.1.0  
**Статус:** Active  
**Последнее обновление:** April 14, 2026

## 1. Контекст и область задачи

Этот репозиторий - MVP-прототип платформы отчетов для технического задания. Обязательные результаты:

- асинхронная генерация отчетов
- API для запуска, проверки статуса, списка запусков, списка отчетов и скачивания результата
- web UI с полным happy path
- минимум два типа отчетов с понятным шаблоном расширения
- запуск одной командой `docker compose up --build`

## 2. Архитектурный стиль

Модульный монолит в монорепозитории с разделением runtime-ролей:

- `web` - frontend dashboard
- `api` - HTTP lifecycle и доступ к метаданным запусков
- `worker` - фоновое выполнение отчетов
- `postgres` - хранение метаданных запусков
- shared volume - хранение сгенерированных файлов

Это сознательно не микросервисная архитектура.

## 3. Границы пакетов

```text
packages/
  shared/   # общие контракты, DTO, статусы
  reports/  # реестр отчетов и модули отчетов
  api/      # REST endpoint'ы lifecycle и скачивания
  worker/   # polling очереди и выполнение отчетов
  web/      # UI для запуска и отслеживания статусов
```

Правила границ:

- report-специфичная логика живет в `packages/reports`
- `api` и `worker` не содержат hardcode-ветвлений по типу отчета
- `web` общается только через публичные API endpoint'ы
- `shared` не зависит от runtime-пакетов

## 4. Поток данных MVP

### 4.1 Получение списка отчетов

1. UI вызывает `GET /api/reports`
2. API читает descriptors из реестра
3. API возвращает данные в envelope

### 4.2 Создание запуска

1. UI вызывает `POST /api/report-runs`
2. API валидирует вход
3. API создает запись в `report_runs` со статусом `queued`
4. API возвращает созданный запуск

### 4.3 Асинхронная обработка

1. Worker опрашивает queued-запуски
2. Worker переводит запуск в `running`
3. Worker находит report module в registry и выполняет `generate(...)`
4. Worker пишет артефакт в shared volume
5. Worker ставит `succeeded` (с метаданными файла) или `failed` (с текстом ошибки)

### 4.4 Отслеживание и скачивание

1. UI опрашивает `GET /api/report-runs` или `GET /api/report-runs/:id`
2. UI включает скачивание после `succeeded`
3. API отдает файл через `GET /api/report-runs/:id/download`

## 5. API контракт

- `GET /api/reports`
- `POST /api/report-runs`
- `GET /api/report-runs`
- `GET /api/report-runs/:id`
- `GET /api/report-runs/:id/download`

Единый JSON envelope:

```ts
{
  success: boolean;
  data?: unknown;
  error?: string;
}
```

Download endpoint может отдавать бинарный контент; ошибки для него также возвращаются как JSON envelope.

## 6. Модель данных (MVP)

Ключевая сущность: `report_runs`

Рекомендуемые поля:

- `id`
- `report_key`
- `format`
- `params_json`
- `status` (`queued | running | succeeded | failed`)
- `created_at`
- `started_at`
- `finished_at`
- `file_path`
- `file_name`
- `error_message`

## 7. Шаблон добавления нового отчета

1. Добавить модуль в `packages/reports/src/handlers/`
2. Описать descriptor (`key`, `name`, `description`, `formats`)
3. Реализовать `generate(run, storageDir)`
4. Зарегистрировать модуль в реестре
5. Проверить, что:
   - модуль виден в `GET /api/reports`
   - запуск проходит async lifecycle
   - результат можно скачать после успешного статуса

## 8. Решения и альтернативы

### Решение 1: Modular Monolith + разделение runtime (`api`/`worker`)

Выбрано: одна кодовая база, отдельные runtime-процессы `api` и `worker`.  
Альтернативы: микросервисы, синхронная генерация в API.

Почему:

- проще реализовать и объяснить в MVP
- дает асинхронность без тяжелой инфраструктуры
- сохраняет явные границы расширения

### Решение 2: Паттерн report registry

Выбрано: модули отчетов в `packages/reports`.  
Альтернативы: ветвления по типам отчетов в роутинге/сервисах API.

Почему:

- быстрое добавление новых отчетов
- меньше связности с внутренностями API и worker
- прямо соответствует требованию расширяемости

### Решение 3: DB polling в MVP

Выбрано: polling queued-запусков из БД.  
Альтернативы: Redis/BullMQ/RabbitMQ/Kafka.

Почему:

- низкий операционный overhead
- достаточно для масштаба прототипа
- простая миграция на полноценную очередь позже

### Решение 4: Shared volume для артефактов

Выбрано: локальный shared volume для файлов результатов.  
Альтернативы: S3/MinIO.

Почему:

- простая локальная сборка
- закрывает обязательный download flow
- не требует облачной инфраструктуры в MVP

## 9. Что намеренно вне MVP scope

- authentication и authorization
- websockets / realtime subscriptions
- внешние очереди (Redis/Kafka/RabbitMQ)
- object storage как основной backend артефактов
- продвинутая observability-платформа
- multi-tenant isolation

## 10. Production roadmap

1. Заменить DB polling на очередь (например BullMQ + Redis)
2. Перенести артефакты в object storage (S3/MinIO)
3. Добавить AuthN/AuthZ (JWT/OAuth2 и ролевая модель)
4. Добавить structured logs, traces, metrics и alerting
5. Добавить миграции схемы БД и CI/CD pipeline

## 11. Текущий статус поставки

Текущее состояние репозитория - bootstrap-уровень:

- monorepo и docker-compose уже настроены
- зарегистрированы два descriptor'а отчетов (`xlsx`, `pdf`)
- API и worker уже стартуют как bootstrap
- полная реализация `report-runs` lifecycle находится в работе

Документ описывает целевую MVP-архитектуру, к которой идет реализация.
