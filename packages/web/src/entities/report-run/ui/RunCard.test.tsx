import { screen } from "@testing-library/react";
import { REPORT_RUN_STATUS, type ReportRun } from "@reportplatform/shared";
import { describe, expect, it, vi } from "vitest";

import { renderWithProviders } from "@/test/render";

import { formatStatusLabel } from "../lib/status";
import { RunCard } from "./RunCard";

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

describe("RunCard", () => {
  it("shows a download action for succeeded runs", () => {
    renderWithProviders(
      <RunCard
        run={buildRun({ status: REPORT_RUN_STATUS.Succeeded })}
        reportNameMap={new Map([["sales-summary", "Sales Summary"]])}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(formatStatusLabel(REPORT_RUN_STATUS.Succeeded))).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/api/report-runs/run-1/download");
    expect(screen.getByRole("button", { name: /run-1/i })).toBeEnabled();
  });

  it("hides download and disables delete for non-succeeded runs", () => {
    renderWithProviders(
      <RunCard
        run={buildRun({ status: REPORT_RUN_STATUS.Running })}
        reportNameMap={new Map([["sales-summary", "Sales Summary"]])}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText(formatStatusLabel(REPORT_RUN_STATUS.Running))).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /run-1/i })).toBeDisabled();
  });
});
