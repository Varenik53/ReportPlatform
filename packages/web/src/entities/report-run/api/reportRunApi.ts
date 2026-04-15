import { requestJson, unwrapArray, unwrapEnvelope } from "@/shared/api";
import type { CreateRunPayload, ReportRun } from "../model/types";

export async function fetchReportRuns(): Promise<ReportRun[]> {
  const payload = await requestJson("/api/report-runs");
  return unwrapArray<ReportRun>(payload, "runs");
}

export async function createReportRun(runPayload: CreateRunPayload): Promise<ReportRun | null> {
  const payload = await requestJson("/api/report-runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(runPayload),
  });

  return unwrapEnvelope<ReportRun>(payload);
}

export async function deleteReportRun(runId: string): Promise<void> {
  await requestJson(`/api/report-runs/${runId}`, { method: "DELETE" });
}

export function getRunDownloadUrl(runId: string): string {
  return `/api/report-runs/${runId}/download`;
}
