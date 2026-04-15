export function parseIntEnv(rawValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? "", 10);

  if (Number.isNaN(parsed)) {
    return fallback;
  }

  return parsed;
}

/** @deprecated Use {@link parseIntEnv} instead. */
export const getPort = parseIntEnv;
