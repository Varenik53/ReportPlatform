# Shared Module

`@reportplatform/shared` — общий пакет с типами, DTO и вспомогательными pure-функциями.

## Ответственность

- единые типы данных между `api`, `worker`, `web` и `reports`;
- общие контракты и helper-функции;

## Структура `src`

- `types/` — доменные и API-контракты (только типы);
- `utils/` — небольшие pure-утилиты без инфраструктурных зависимостей;
- `mappers/` — преобразование данных между слоями (например, DB -> доменная модель);
- `index.ts` — публичный barrel-слой, который реэкспортирует стабильный API пакета.

## Использование

Пакет подключается как workspace-зависимость:

```json
"@reportplatform/shared": "workspace:*"
```

## Скрипты

- `pnpm --filter @reportplatform/shared dev` — watch-сборка TypeScript;
- `pnpm --filter @reportplatform/shared build` — сборка в `dist`;
- `pnpm --filter @reportplatform/shared test` — запуск тестов;
- `pnpm --filter @reportplatform/shared lint` — проверка eslint;
- `pnpm --filter @reportplatform/shared typecheck` — проверка типов.
