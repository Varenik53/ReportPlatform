import type { ReportRun, ReportRunDbRow } from "../types/report-run.js";
import { normalizeParams } from "../utils/params.js";

function toIsoString(value: Date | string | null): string | null {
  if (value === null) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toRunParams(value: unknown): Record<string, string> {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return toRunParams(parsed);
    } catch {
      return {};
    }
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }

  return normalizeParams(value);
}

export function mapReportRunDbRow(row: ReportRunDbRow): ReportRun {
  return {
    id: row.id,
    reportKey: row.report_key,
    format: row.format,
    status: row.status,
    createdAt: toIsoString(row.created_at) ?? new Date(0).toISOString(),
    params: toRunParams(row.params_json),
    startedAt: toIsoString(row.started_at),
    finishedAt: toIsoString(row.finished_at),
    filePath: row.file_path,
    fileName: row.file_name,
    errorMessage: row.error_message,
  };
}
