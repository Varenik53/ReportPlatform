import { describe, expect, it } from "vitest";

import { REPORT_RUN_STATUS, type ReportRun } from "@reportplatform/shared";

import { salesSummaryHandler } from "./sales-summary.handler.js";
import { weatherBriefHandler } from "./weather-brief.handler.js";

function buildRun(overrides: Partial<ReportRun> = {}): ReportRun {
  return {
    id: "run-1",
    reportKey: "sales-summary",
    format: "xlsx",
    status: REPORT_RUN_STATUS.Queued,
    createdAt: "2026-04-01T10:00:00.000Z",
    params: {
      periodFrom: "2026-01-01",
      periodTo: "2026-01-31",
    },
    startedAt: null,
    finishedAt: null,
    filePath: null,
    fileName: null,
    errorMessage: null,
    ...overrides,
  };
}

describe("report handlers", () => {
  it("generates a valid xlsx artifact for sales summary", async () => {
    const artifact = await salesSummaryHandler.generate(buildRun());

    expect(artifact.fileExtension).toBe("xlsx");
    expect(artifact.content.length).toBeGreaterThan(0);
    expect(artifact.content.subarray(0, 2).toString()).toBe("PK");
  });

  it("generates a non-empty pdf artifact for weather brief", async () => {
    const artifact = await weatherBriefHandler.generate(
      buildRun({
        reportKey: "weather-brief",
        format: "pdf",
        params: {
          city: "Berlin",
          days: "7",
        },
      }),
    );

    expect(artifact.fileExtension).toBe("pdf");
    expect(artifact.content.length).toBeGreaterThan(0);
    expect(artifact.content.subarray(0, 4).toString()).toBe("%PDF");
  });
});
