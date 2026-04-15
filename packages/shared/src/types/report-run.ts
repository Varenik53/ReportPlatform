import type { ReportFormat } from "./report.js";

export type ReportRunStatus = "queued" | "running" | "succeeded" | "failed";

export const REPORT_RUN_STATUS = {
  Queued: "queued",
  Running: "running",
  Succeeded: "succeeded",
  Failed: "failed",
} as const satisfies Record<string, ReportRunStatus>;

export interface ReportRun {
  id: string;
  reportKey: string;
  format: ReportFormat;
  status: ReportRunStatus;
  createdAt: string;
  params: Record<string, string>;
  startedAt: string | null;
  finishedAt: string | null;
  filePath: string | null;
  fileName: string | null;
  errorMessage: string | null;
}

export interface ReportRunDbRow {
  id: string;
  report_key: string;
  format: ReportFormat;
  status: ReportRunStatus;
  created_at: Date | string;
  params_json: unknown;
  started_at: Date | string | null;
  finished_at: Date | string | null;
  file_path: string | null;
  file_name: string | null;
  error_message: string | null;
}

export interface CreateReportRunInput {
  reportKey: string;
  format: ReportFormat;
  params: Record<string, string>;
}
