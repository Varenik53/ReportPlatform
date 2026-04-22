/**
 * Парсит значение env-переменной как целое число в десятичной системе.
 *
 * Возвращает `fallback`, если значение отсутствует или не парсится.
 */
export function parseIntEnv(rawValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? "", 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

/** @deprecated Используйте {@link parseIntEnv}. */
export const getPort = parseIntEnv;
