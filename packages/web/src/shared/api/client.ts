import type { CreateRunPayload, ReportDescriptor, ReportRun } from "./types";

interface ApiEnvelope<T> {
  success?: boolean;
  data?: T;
  error?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, init);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<unknown>;
}

function unwrapReports(payload: unknown): ReportDescriptor[] {
  if (!isRecord(payload)) {
    return [];
  }

  const envelope = payload as ApiEnvelope<unknown>;

  if (Array.isArray(envelope.data)) {
    return envelope.data as ReportDescriptor[];
  }

  if (isRecord(envelope.data) && Array.isArray(envelope.data.reports)) {
    return envelope.data.reports as ReportDescriptor[];
  }

  if (Array.isArray(payload.reports)) {
    return payload.reports as ReportDescriptor[];
  }

  return [];
}

function unwrapRuns(payload: unknown): ReportRun[] {
  if (!isRecord(payload)) {
    return [];
  }

  const envelope = payload as ApiEnvelope<unknown>;

  if (Array.isArray(envelope.data)) {
    return envelope.data as ReportRun[];
  }

  if (isRecord(envelope.data) && Array.isArray(envelope.data.runs)) {
    return envelope.data.runs as ReportRun[];
  }

  if (Array.isArray(payload.runs)) {
    return payload.runs as ReportRun[];
  }

  return [];
}

function unwrapRun(payload: unknown): ReportRun | null {
  if (!isRecord(payload)) {
    return null;
  }

  const envelope = payload as ApiEnvelope<unknown>;
  if (isRecord(envelope.data)) {
    return envelope.data as unknown as ReportRun;
  }

  if (isRecord(payload.run)) {
    return payload.run as unknown as ReportRun;
  }

  return null;
}

export async function fetchReports(): Promise<ReportDescriptor[]> {
  const payload = await requestJson("/api/reports");
  return unwrapReports(payload);
}

export async function fetchReportRuns(): Promise<ReportRun[]> {
  const payload = await requestJson("/api/report-runs");
  return unwrapRuns(payload);
}

export async function createReportRun(runPayload: CreateRunPayload): Promise<ReportRun | null> {
  const payload = await requestJson("/api/report-runs", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(runPayload),
  });

  return unwrapRun(payload);
}

export function getRunDownloadUrl(runId: string): string {
  return `/api/report-runs/${runId}/download`;
}
