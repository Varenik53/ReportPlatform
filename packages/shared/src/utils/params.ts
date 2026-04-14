export function normalizeParams(value: unknown): Record<string, string> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
    (accumulator, [key, entry]) => {
      accumulator[key] = String(entry);
      return accumulator;
    },
    {},
  );
}
