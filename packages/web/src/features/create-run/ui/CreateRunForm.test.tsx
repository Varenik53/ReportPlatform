import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ReportDescriptor } from "@/entities/report";
import { renderWithProviders } from "@/test/render";

import { CreateRunForm } from "./CreateRunForm";

const reports: ReportDescriptor[] = [
  {
    key: "sales-summary",
    name: "Sales Summary",
    description: "XLSX sales report",
    formats: ["xlsx"],
  },
  {
    key: "weather-brief",
    name: "Weather Brief",
    description: "PDF weather report",
    formats: ["pdf"],
  },
];

describe("CreateRunForm", () => {
  it("selects the first report and the first format by default", async () => {
    renderWithProviders(<CreateRunForm reports={reports} disabled={false} onSubmit={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByRole("combobox")[0]).toHaveTextContent("Sales Summary");
      expect(screen.getAllByRole("combobox")[1]).toHaveTextContent("XLSX");
    });
  });

  it("syncs the format when the selected report changes", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CreateRunForm reports={reports} disabled={false} onSubmit={vi.fn()} />);

    const reportSelect = screen.getAllByRole("combobox")[0];

    await user.click(reportSelect);
    await user.click(screen.getByRole("option", { name: "Weather Brief" }));

    expect(screen.getAllByRole("combobox")[1]).toHaveTextContent("PDF");
  });

  it("generates report-specific test params", async () => {
    const user = userEvent.setup();

    renderWithProviders(<CreateRunForm reports={reports} disabled={false} onSubmit={vi.fn()} />);

    await user.click(screen.getAllByRole("button")[0]);

    expect(screen.getByRole("textbox", { name: /JSON/i })).toHaveValue(
      JSON.stringify(
        {
          periodFrom: "2026-01-01",
          periodTo: "2026-01-31",
          region: "EU",
        },
        null,
        2,
      ),
    );
  });

  it("blocks submit for invalid JSON", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    renderWithProviders(<CreateRunForm reports={reports} disabled={false} onSubmit={onSubmit} />);

    fireEvent.change(screen.getByRole("textbox", { name: /JSON/i }), {
      target: { value: '{"days":' },
    });
    await user.click(screen.getAllByRole("button")[1]);

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits normalized params and clears the field after success", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<CreateRunForm reports={reports} disabled={false} onSubmit={onSubmit} />);

    const paramsInput = screen.getByRole("textbox", { name: /JSON/i });

    fireEvent.change(paramsInput, {
      target: { value: '{"days":7,"enabled":true}' },
    });
    await user.click(screen.getAllByRole("button")[1]);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        reportKey: "sales-summary",
        format: "xlsx",
        params: {
          days: "7",
          enabled: "true",
        },
      });
    });

    expect(paramsInput).toHaveValue("");
  });
});
