export function getPort(rawValue: string | undefined, fallbackPort: number): number {
  const parsedPort = Number.parseInt(rawValue ?? "", 10);

  if (Number.isNaN(parsedPort)) {
    return fallbackPort;
  }

  return parsedPort;
}
