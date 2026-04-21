import { REPORT_RUN_STATUS, type ReportRun } from "@reportplatform/shared";
import { beforeEach, describe, expect, it, vi } from "vitest";

const queueMocks = vi.hoisted(() => ({
  claimNextQueuedReportRun: vi.fn(),
  markReportRunFailed: vi.fn(),
  processReportRun: vi.fn(),
}));

vi.mock("./report-runs.repository.js", () => ({
  claimNextQueuedReportRun: queueMocks.claimNextQueuedReportRun,
  markReportRunFailed: queueMocks.markReportRunFailed,
}));

vi.mock("./report-run.processor.js", () => ({
  processReportRun: queueMocks.processReportRun,
}));

function buildRun(id: string): ReportRun {
  return {
    id,
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
  };
}

async function importQueueProcessor() {
  vi.resetModules();
  return import("./queue.processor.js");
}

describe("processQueue", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not start a second processing pass while one is active", async () => {
    let resolveProcessing: (() => void) | undefined;

    queueMocks.claimNextQueuedReportRun
      .mockResolvedValueOnce(buildRun("run-1"))
      .mockResolvedValueOnce(null);
    queueMocks.processReportRun.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveProcessing = resolve;
        }),
    );

    const queueProcessor = await importQueueProcessor();
    const firstPass = queueProcessor.processQueue();
    const secondPass = queueProcessor.processQueue();

    await expect(secondPass).resolves.toBeUndefined();
    expect(queueMocks.claimNextQueuedReportRun).toHaveBeenCalledTimes(1);

    resolveProcessing?.();
    await firstPass;
  });

  it("drains the queue until no queued runs remain", async () => {
    const run1 = buildRun("run-1");
    const run2 = buildRun("run-2");

    queueMocks.claimNextQueuedReportRun
      .mockResolvedValueOnce(run1)
      .mockResolvedValueOnce(run2)
      .mockResolvedValueOnce(null);
    queueMocks.processReportRun.mockResolvedValue(undefined);

    const queueProcessor = await importQueueProcessor();
    await queueProcessor.processQueue();

    expect(queueMocks.processReportRun).toHaveBeenNthCalledWith(1, run1);
    expect(queueMocks.processReportRun).toHaveBeenNthCalledWith(2, run2);
  });

  it("marks runs as failed when processing throws", async () => {
    queueMocks.claimNextQueuedReportRun
      .mockResolvedValueOnce(buildRun("run-1"))
      .mockResolvedValueOnce(null);
    queueMocks.processReportRun.mockRejectedValue(new Error("worker boom"));

    const queueProcessor = await importQueueProcessor();
    await queueProcessor.processQueue();

    expect(queueMocks.markReportRunFailed).toHaveBeenCalledWith("run-1", "worker boom");
  });

  it("stops immediately after shutdown is requested", async () => {
    const queueProcessor = await importQueueProcessor();

    queueProcessor.requestShutdown();
    await queueProcessor.processQueue();

    expect(queueMocks.claimNextQueuedReportRun).not.toHaveBeenCalled();
  });
});
