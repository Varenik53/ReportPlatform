import type { ReportDescriptor } from "@reportplatform/shared";

import type { ReportArtifact, ReportHandler } from "./contracts/report-handler.js";
import {
  getReportDescriptors,
  getReportHandlerByKey,
  getReportHandlers,
} from "./registry/report-registry.js";

export type { ReportArtifact, ReportHandler };

export function getAvailableReports(): ReportDescriptor[] {
  return getReportDescriptors();
}

export { getReportHandlerByKey, getReportHandlers };
