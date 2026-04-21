import { resolve } from "node:path";

import { REPORT_RUN_STATUS, type ReportRun } from "@reportplatform/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const processorMocks = vi.hoisted(() => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  getReportHandlerByKey: vi.fn(),
  markReportRunFailed: vi.fn(),
  markReportRunSucceeded: vi.fn(),
  storageDir: "C:/report-platform/storage",
}));

vi.mock("node:fs/promises", () => ({
  mkdir: processorMocks.mkdir,
  writeFile: processorMocks.writeFile,
}));

vi.mock("@reportplatform/reports", () => ({
  getReportHandlerByKey: processorMocks.getReportHandlerByKey,
}));

vi.mock("./report-runs.repository.js", () => ({
  markReportRunFailed: processorMocks.markReportRunFailed,
  markReportRunSucceeded: processorMocks.markReportRunSucceeded,
}));

vi.mock("./config.js", () => ({
  storageDir: processorMocks.storageDir,
}));

import { processReportRun } from "./report-run.processor.js";

function buildRun(overrides: Partial<ReportRun> = {}): ReportRun {
  return {
    id: "run-1",
    reportKey: "sales-summary",
    format: "xlsx",
    status: REPORT_RUN_STATUS.Queued,
    createdAt: "2026-04-01T10:00:00.000Z",
    params: {},
    startedAt: null,
    finishedAt: null,
    filePath: null,
    fileName: null,
    errorMessage: null,
    ...overrides,
  };
}

describe("processReportRun", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("marks the run as failed when report key is unknown", async () => {
    processorMocks.getReportHandlerByKey.mockReturnValue(undefined);

    await processReportRun(buildRun({ reportKey: "missing-report" }));

    expect(processorMocks.markReportRunFailed).toHaveBeenCalledWith(
      "run-1",
      expect.stringContaining("missing-report"),
    );
    expect(processorMocks.writeFile).not.toHaveBeenCalled();
  });

  it("marks the run as failed when the report format is unsupported", async () => {
    processorMocks.getReportHandlerByKey.mockReturnValue({
      descriptor: {
        key: "sales-summary",
        formats: ["xlsx"],
      },
      generate: vi.fn(),
    });

    await processReportRun(buildRun({ format: "pdf" }));

    expect(processorMocks.markReportRunFailed).toHaveBeenCalledWith(
      "run-1",
      expect.stringContaining("pdf"),
    );
    expect(processorMocks.writeFile).not.toHaveBeenCalled();
  });

  it("writes the artifact and marks the run as succeeded on success", async () => {
    const artifact = Buffer.from("xlsx-binary");

    processorMocks.getReportHandlerByKey.mockReturnValue({
      descriptor: {
        key: "sales-summary",
        formats: ["xlsx"],
      },
      generate: vi.fn().mockResolvedValue({
        fileExtension: "xlsx",
        content: artifact,
      }),
    });

    await processReportRun(buildRun());

    expect(processorMocks.mkdir).toHaveBeenCalledWith(processorMocks.storageDir, {
      recursive: true,
    });
    expect(processorMocks.writeFile).toHaveBeenCalledWith(
      resolve(processorMocks.storageDir, "run-1.xlsx"),
      artifact,
    );
    expect(processorMocks.markReportRunSucceeded).toHaveBeenCalledWith(
      "run-1",
      "run-1.xlsx",
      "sales-summary-run-1.xlsx",
    );
  });
});
