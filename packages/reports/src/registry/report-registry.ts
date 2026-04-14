import type { ReportDescriptor } from "@reportplatform/shared";

import type { ReportHandler } from "../contracts/report-handler.js";
import { salesSummaryHandler } from "../handlers/sales-summary.handler.js";
import { weatherBriefHandler } from "../handlers/weather-brief.handler.js";

const reportHandlers: ReportHandler[] = [salesSummaryHandler, weatherBriefHandler];

export function getReportHandlers(): ReportHandler[] {
  return reportHandlers;
}

export function getReportHandlerByKey(key: string): ReportHandler | undefined {
  return reportHandlers.find((reportHandler) => reportHandler.descriptor.key === key);
}

export function getReportDescriptors(): ReportDescriptor[] {
  return reportHandlers.map((reportHandler) => reportHandler.descriptor);
}
