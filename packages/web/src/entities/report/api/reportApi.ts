import { requestJson, unwrapArray } from "@/shared/api";
import type { ReportDescriptor } from "../model/types";

export async function fetchReports(): Promise<ReportDescriptor[]> {
  const payload = await requestJson("/api/reports");
  return unwrapArray<ReportDescriptor>(payload, "reports");
}
