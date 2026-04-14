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

export interface CreateRunPayload {
  reportKey: string;
  format: ReportFormat;
  params: Record<string, string>;
}
