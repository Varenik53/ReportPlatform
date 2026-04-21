import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateRunPayload, ReportRun } from "@/entities/report-run";
import type { ReportDescriptor } from "@/entities/report";
import { renderWithProviders } from "@/test/render";

const dashboardMocks = vi.hoisted(() => ({
  fetchReports: vi.fn(),
  fetchReportRuns: vi.fn(),
  createReportRun: vi.fn(),
  deleteReportRun: vi.fn(),
}));

vi.mock("@/entities/report", () => ({
  reportQueries: {
    all: () => ({
      queryKey: ["reports"],
      queryFn: dashboardMocks.fetchReports,
    }),
  },
}));

vi.mock("@/entities/report-run", () => ({
  createReportRun: dashboardMocks.createReportRun,
  deleteReportRun: dashboardMocks.deleteReportRun,
  reportRunQueries: {
    all: () => ({
      queryKey: ["report-runs"],
      queryFn: dashboardMocks.fetchReportRuns,
    }),
  },
}));

vi.mock("@/features/create-run", () => ({
  CreateRunForm: ({ onSubmit }: { onSubmit: (payload: CreateRunPayload) => Promise<void> }) => (
    <button
      type="button"
      onClick={() =>
        void onSubmit({
          reportKey: "sales-summary",
          format: "xlsx",
          params: {
            periodFrom: "2026-01-01",
          },
        })
      }
    >
      create-run
    </button>
  ),
}));

vi.mock("@/widgets/reports-list", () => ({
  ReportsList: ({ reports }: { reports: ReportDescriptor[] }) => (
    <div data-testid="reports-list">{reports.map((report) => report.key).join(",")}</div>
  ),
}));

vi.mock("@/widgets/dashboard-stats", () => ({
  DashboardStats: ({ reportsCount, runsCount }: { reportsCount: number; runsCount: number }) => (
    <div data-testid="dashboard-stats">{`${reportsCount}:${runsCount}`}</div>
  ),
}));

vi.mock("@/widgets/runs-list", () => ({
  RunsList: ({
    runs,
    onDeleteRun,
  }: {
    runs: ReportRun[];
    onDeleteRun?: (runId: string) => void;
  }) => (
    <div>
      <div data-testid="runs-list">{runs.map((run) => run.id).join(",")}</div>
      <button type="button" onClick={() => onDeleteRun?.(runs[0]?.id ?? "missing-run")}>
        delete-run
      </button>
    </div>
  ),
}));

import { DashboardPage } from "./DashboardPage";

function buildRun(id: string, createdAt: string): ReportRun {
  return {
    id,
    reportKey: "sales-summary",
    format: "xlsx",
    status: "queued",
    createdAt,
    params: {},
    startedAt: null,
    finishedAt: null,
    filePath: null,
    fileName: null,
    errorMessage: null,
  };
}

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads dashboard data and sorts runs by creation date descending", async () => {
    dashboardMocks.fetchReports.mockResolvedValue([
      {
        key: "sales-summary",
        name: "Sales Summary",
        description: "Sales report",
        formats: ["xlsx"],
      },
    ]);
    dashboardMocks.fetchReportRuns.mockResolvedValue([
      buildRun("older-run", "2026-04-01T08:00:00.000Z"),
      buildRun("newer-run", "2026-04-01T10:00:00.000Z"),
    ]);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("reports-list")).toHaveTextContent("sales-summary");
      expect(screen.getByTestId("runs-list")).toHaveTextContent("newer-run,older-run");
    });
  });

  it("shows a warning banner when one of the dashboard queries fails", async () => {
    dashboardMocks.fetchReports.mockRejectedValue(new Error("reports failed"));
    dashboardMocks.fetchReportRuns.mockResolvedValue([]);

    renderWithProviders(<DashboardPage />);

    expect(await screen.findByRole("status")).toHaveTextContent("reports failed");
  });

  it("invalidates report runs after create and delete mutations", async () => {
    const user = userEvent.setup();

    dashboardMocks.fetchReports.mockResolvedValue([
      {
        key: "sales-summary",
        name: "Sales Summary",
        description: "Sales report",
        formats: ["xlsx"],
      },
    ]);
    dashboardMocks.fetchReportRuns
      .mockResolvedValueOnce([buildRun("run-1", "2026-04-01T09:00:00.000Z")])
      .mockResolvedValueOnce([
        buildRun("run-2", "2026-04-01T10:00:00.000Z"),
        buildRun("run-1", "2026-04-01T09:00:00.000Z"),
      ])
      .mockResolvedValueOnce([buildRun("run-2", "2026-04-01T10:00:00.000Z")]);
    dashboardMocks.createReportRun.mockResolvedValue(buildRun("run-2", "2026-04-01T10:00:00.000Z"));
    dashboardMocks.deleteReportRun.mockResolvedValue(undefined);

    renderWithProviders(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId("runs-list")).toHaveTextContent("run-1");
    });

    await user.click(screen.getByRole("button", { name: "create-run" }));

    await waitFor(() => {
      expect(dashboardMocks.createReportRun).toHaveBeenCalled();
      expect(screen.getByTestId("runs-list")).toHaveTextContent("run-2,run-1");
    });

    await user.click(screen.getByRole("button", { name: "delete-run" }));

    await waitFor(() => {
      expect(dashboardMocks.deleteReportRun).toHaveBeenCalledWith("run-2");
      expect(screen.getByTestId("runs-list")).toHaveTextContent("run-2");
    });
  });
});
