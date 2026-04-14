export type ReportFormat = "xlsx" | "pdf";

export type ReportRunStatus = "queued" | "running" | "succeeded" | "failed";

export interface ReportDescriptor {
  key: string;
  name: string;
  description: string;
  formats: ReportFormat[];
}

export interface ReportRun {
  id: string;
  reportKey: string;
  format: ReportFormat;
  status: ReportRunStatus;
  createdAt: string;
}

export function formatDate(date: Date): string {
  return date.toISOString();
}

export function getPort(rawValue: string | undefined, fallbackPort: number): number {
  const parsedPort = Number.parseInt(rawValue ?? "", 10);

  if (Number.isNaN(parsedPort)) {
    return fallbackPort;
  }

  return parsedPort;
}
