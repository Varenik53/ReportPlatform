# Web Service

`@reportplatform/web` — React-приложение для работы с платформой отчетов.

## Ответственность

- отображает список доступных отчетов;
- предоставляет форму запуска отчета;
- показывает список запусков и их статусы;
- позволяет скачать результат после успешной генерации.

## Архитектура (Feature-Sliced Design)

Приложение организовано по [FSD](https://feature-sliced.design/):

```text
src/
  app/              # Точка входа, провайдеры (ThemeProvider), глобальные стили
  pages/            # Страницы — композиция виджетов и фич
    dashboard/
  widgets/          # Составные UI-блоки
    dashboard-stats/
    reports-list/
    runs-list/
  features/         # Пользовательские сценарии
    create-run/
  entities/         # Бизнес-сущности (модель, API, UI-карточка)
    report/
    report-run/
  shared/           # Общие утилиты без бизнес-логики
    api/
    lib/
```

Правило зависимостей: `app → pages → widgets → features → entities → shared`.

Алиас `@/` указывает на `src/` (настроен в `tsconfig.app.json` и `vite.config.ts`).

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
