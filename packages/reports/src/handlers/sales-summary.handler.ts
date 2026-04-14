import type { ReportHandler } from "../contracts/report-handler.js";
import { buildStubReportContent } from "../services/stub-report-content.service.js";

export const salesSummaryHandler: ReportHandler = {
  descriptor: {
    key: "sales-summary",
    name: "Sales Summary",
    description: "XLSX report with aggregated sales metrics for a selected period.",
    formats: ["xlsx"],
  },
  generate(run) {
    return Promise.resolve({
      fileExtension: "xlsx",
      content: buildStubReportContent("Sales Summary", run),
    });
  },
};
