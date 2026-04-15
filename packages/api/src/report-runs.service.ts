import { Injectable } from "@nestjs/common";
import { getAvailableReports } from "@reportplatform/reports";
import {
  isRecord,
  normalizeParams,
  type CreateReportRunInput,
  type ReportFormat,
} from "@reportplatform/shared";
import {
  createReportRun,
  deleteReportRun,
  findReportRunById,
  listReportRuns,
} from "./report-runs.repository.js";

@Injectable()
export class ReportRunsService {
  async getRuns() {
    return listReportRuns();
  }

  async getRunById(runId: string) {
    return findReportRunById(runId);
  }

  parseCreateRunPayload(payload: unknown): CreateReportRunInput | null {
    if (!isRecord(payload)) {
      return null;
    }

    if (typeof payload.reportKey !== "string" || typeof payload.format !== "string") {
      return null;
    }

    const rawParams = payload.params;
    if (!isRecord(rawParams)) {
      return null;
    }

    const params = normalizeParams(rawParams);

    return {
      reportKey: payload.reportKey,
      format: payload.format as ReportFormat,
      params,
    };
  }

  isKnownReport(reportKey: string): boolean {
    return getAvailableReports().some((report) => report.key === reportKey);
  }

  isFormatSupported(reportKey: string, format: ReportFormat): boolean {
    const selectedReport = getAvailableReports().find((report) => report.key === reportKey);
    return selectedReport ? selectedReport.formats.includes(format) : false;
  }

  async createRun(payload: CreateReportRunInput) {
    return createReportRun(payload);
  }

  async deleteRun(runId: string, storageDir: string): Promise<boolean> {
    return deleteReportRun(runId, storageDir);
  }
}
