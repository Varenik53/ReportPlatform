import { describe, expect, it } from "vitest";

import { REPORT_RUN_STATUS, type ReportRunDbRow } from "../types/report-run.js";
import { mapReportRunDbRow } from "./report-run.mapper.js";

describe("mapReportRunDbRow", () => {
  it("maps db row fields into the public report run shape", () => {
    const row: ReportRunDbRow = {
      id: "run-1",
      report_key: "sales-summary",
      format: "xlsx",
      status: REPORT_RUN_STATUS.Succeeded,
      created_at: new Date("2026-04-01T10:00:00.000Z"),
      params_json: JSON.stringify({ periodFrom: "2026-01-01", days: 7 }),
      started_at: "2026-04-01T10:01:00.000Z",
      finished_at: "2026-04-01T10:02:00.000Z",
      file_path: "run-1.xlsx",
      file_name: "sales-summary-run-1.xlsx",
      error_message: null,
    };

    expect(mapReportRunDbRow(row)).toEqual({
      id: "run-1",
      reportKey: "sales-summary",
      format: "xlsx",
      status: REPORT_RUN_STATUS.Succeeded,
      createdAt: "2026-04-01T10:00:00.000Z",
      params: {
        periodFrom: "2026-01-01",
        days: "7",
      },
      startedAt: "2026-04-01T10:01:00.000Z",
      finishedAt: "2026-04-01T10:02:00.000Z",
      filePath: "run-1.xlsx",
      fileName: "sales-summary-run-1.xlsx",
      errorMessage: null,
    });
  });

  it("falls back to safe defaults for malformed params and dates", () => {
    const row: ReportRunDbRow = {
      id: "run-2",
      report_key: "weather-brief",
      format: "pdf",
      status: REPORT_RUN_STATUS.Failed,
      created_at: "invalid-date",
      params_json: "not-json",
      started_at: null,
      finished_at: null,
      file_path: null,
      file_name: null,
      error_message: "boom",
    };

    expect(mapReportRunDbRow(row)).toEqual({
      id: "run-2",
      reportKey: "weather-brief",
      format: "pdf",
      status: REPORT_RUN_STATUS.Failed,
      createdAt: new Date(0).toISOString(),
      params: {},
      startedAt: null,
      finishedAt: null,
      filePath: null,
      fileName: null,
      errorMessage: "boom",
    });
  });
});
