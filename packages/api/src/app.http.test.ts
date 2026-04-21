import { PassThrough } from "node:stream";
import type { Server } from "node:net";

import { HttpStatus, type INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { REPORT_FORMAT_META, REPORT_RUN_STATUS, type ReportRun } from "@reportplatform/shared";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi, type MockedFunction } from "vitest";

import type { ReportRunsService } from "./report-runs.service.js";

function httpRequest(app: INestApplication) {
  return request(app.getHttpServer() as Server);
}

const createReadStreamMock = vi.fn();
const resolveExistingArtifactPathMock = vi.fn();
const resolveStorageDirectoryMock = vi.fn(() => "/tmp/storage");

vi.mock("node:fs", () => ({
  createReadStream: createReadStreamMock,
}));

vi.mock("@reportplatform/shared/server", async () => {
  const actual = await vi.importActual("@reportplatform/shared/server");

  return {
    ...actual,
    resolveExistingArtifactPath: resolveExistingArtifactPathMock,
    resolveStorageDirectory: resolveStorageDirectoryMock,
  };
});

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

describe("API HTTP contracts", () => {
  let app: INestApplication;
  let reportRunsServiceMock: {
    getRuns: MockedFunction<ReportRunsService["getRuns"]>;
    parseCreateRunPayload: MockedFunction<ReportRunsService["parseCreateRunPayload"]>;
    isKnownReport: MockedFunction<ReportRunsService["isKnownReport"]>;
    isFormatSupported: MockedFunction<ReportRunsService["isFormatSupported"]>;
    createRun: MockedFunction<ReportRunsService["createRun"]>;
    getRunById: MockedFunction<ReportRunsService["getRunById"]>;
    deleteRun: MockedFunction<ReportRunsService["deleteRun"]>;
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    reportRunsServiceMock = {
      getRuns: vi.fn().mockResolvedValue([]),
      parseCreateRunPayload: vi.fn(),
      isKnownReport: vi.fn(),
      isFormatSupported: vi.fn(),
      createRun: vi.fn(),
      getRunById: vi.fn(),
      deleteRun: vi.fn(),
    };

    const { AppModule } = await import("./app.module.js");
    const { ApiExceptionFilter } = await import("./common/api-exception.filter.js");
    const { ReportRunsService } = await import("./report-runs.service.js");

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ReportRunsService)
      .useValue(reportRunsServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns health status", async () => {
    const response = await httpRequest(app).get("/health").expect(HttpStatus.OK);

    expect(response.body).toEqual({
      success: true,
      data: {
        status: "ok",
        service: "api",
      },
    });
  });

  it("returns available reports", async () => {
    const response = await httpRequest(app).get("/reports").expect(HttpStatus.OK);

    const body = response.body as { success: boolean; data: { reports: unknown[] } };
    expect(body.success).toBe(true);
    expect(body.data.reports).toHaveLength(2);
  });

  it("lists report runs with a success envelope", async () => {
    reportRunsServiceMock.getRuns.mockResolvedValue([buildRun()]);

    const response = await httpRequest(app).get("/report-runs").expect(HttpStatus.OK);

    expect(response.body).toEqual({
      success: true,
      data: {
        runs: [buildRun()],
      },
    });
  });

  it("rejects invalid report run payloads", async () => {
    reportRunsServiceMock.parseCreateRunPayload.mockReturnValue(null);

    const response = await httpRequest(app)
      .post("/report-runs")
      .send({ invalid: true })
      .expect(HttpStatus.BAD_REQUEST);

    const body = response.body as { success: boolean };
    expect(body.success).toBe(false);
    expect(reportRunsServiceMock.createRun).not.toHaveBeenCalled();
  });

  it("creates a report run for a valid payload", async () => {
    const payload = {
      reportKey: "sales-summary",
      format: "xlsx" as const,
      params: {
        periodFrom: "2026-01-01",
      },
    };
    const createdRun = buildRun({ status: REPORT_RUN_STATUS.Queued });

    reportRunsServiceMock.parseCreateRunPayload.mockReturnValue(payload);
    reportRunsServiceMock.isKnownReport.mockReturnValue(true);
    reportRunsServiceMock.isFormatSupported.mockReturnValue(true);
    reportRunsServiceMock.createRun.mockResolvedValue(createdRun);

    const response = await httpRequest(app)
      .post("/report-runs")
      .send(payload)
      .expect(HttpStatus.CREATED);

    expect(response.body).toEqual({
      success: true,
      data: createdRun,
    });
  });

  it("returns 404 for an unknown report run", async () => {
    reportRunsServiceMock.getRunById.mockResolvedValue(null);

    const response = await httpRequest(app)
      .get("/report-runs/missing-run")
      .expect(HttpStatus.NOT_FOUND);

    const body = response.body as { success: boolean };
    expect(body.success).toBe(false);
  });

  it("returns 409 while a report artifact is not ready for download", async () => {
    reportRunsServiceMock.getRunById.mockResolvedValue(
      buildRun({ status: REPORT_RUN_STATUS.Queued }),
    );

    const response = await httpRequest(app)
      .get("/report-runs/run-1/download")
      .expect(HttpStatus.CONFLICT);

    const body = response.body as { success: boolean };
    expect(body.success).toBe(false);
  });

  it("returns 404 when a completed report artifact file is missing", async () => {
    reportRunsServiceMock.getRunById.mockResolvedValue(
      buildRun({
        status: REPORT_RUN_STATUS.Succeeded,
        filePath: "run-1.xlsx",
        fileName: "sales-summary-run-1.xlsx",
      }),
    );
    resolveExistingArtifactPathMock.mockResolvedValue(null);

    const response = await httpRequest(app)
      .get("/report-runs/run-1/download")
      .expect(HttpStatus.NOT_FOUND);

    const body = response.body as { success: boolean };
    expect(body.success).toBe(false);
  });

  it("streams a completed artifact with download headers", async () => {
    const stream = new PassThrough();

    reportRunsServiceMock.getRunById.mockResolvedValue(
      buildRun({
        status: REPORT_RUN_STATUS.Succeeded,
        filePath: "run-1.xlsx",
        fileName: "sales-summary-run-1.xlsx",
      }),
    );
    resolveExistingArtifactPathMock.mockResolvedValue("/tmp/storage/run-1.xlsx");
    createReadStreamMock.mockReturnValue(stream);

    const responsePromise = httpRequest(app)
      .get("/report-runs/run-1/download")
      .expect(HttpStatus.OK)
      .expect("content-type", REPORT_FORMAT_META.xlsx.mimeType)
      .expect("content-disposition", 'attachment; filename="sales-summary-run-1.xlsx"');

    stream.end("report-content");

    const response = await responsePromise;

    expect(response.text).toBe("report-content");
  });

  it("deletes an existing report run", async () => {
    reportRunsServiceMock.deleteRun.mockResolvedValue(true);

    await httpRequest(app).delete("/report-runs/run-1").expect(HttpStatus.NO_CONTENT);

    expect(reportRunsServiceMock.deleteRun).toHaveBeenCalledWith("run-1", "/tmp/storage");
  });

  it("returns 404 when deleting a missing report run", async () => {
    reportRunsServiceMock.deleteRun.mockResolvedValue(false);

    const response = await httpRequest(app)
      .delete("/report-runs/missing-run")
      .expect(HttpStatus.NOT_FOUND);

    const body = response.body as { success: boolean };
    expect(body.success).toBe(false);
  });
});
