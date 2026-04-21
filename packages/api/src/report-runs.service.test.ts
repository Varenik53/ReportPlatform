import { describe, expect, it } from "vitest";

import { ReportRunsService } from "./report-runs.service.js";

describe("ReportRunsService.parseCreateRunPayload", () => {
  const service = new ReportRunsService();

  it("returns null for invalid payloads", () => {
    expect(service.parseCreateRunPayload(null)).toBeNull();
    expect(service.parseCreateRunPayload([])).toBeNull();
    expect(service.parseCreateRunPayload({ reportKey: "sales-summary" })).toBeNull();
    expect(
      service.parseCreateRunPayload({
        reportKey: "sales-summary",
        format: "xlsx",
      }),
    ).toBeNull();
  });

  it("normalizes numeric and boolean params into strings", () => {
    expect(
      service.parseCreateRunPayload({
        reportKey: "weather-brief",
        format: "pdf",
        params: {
          days: 7,
          enabled: true,
          city: "Berlin",
        },
      }),
    ).toEqual({
      reportKey: "weather-brief",
      format: "pdf",
      params: {
        days: "7",
        enabled: "true",
        city: "Berlin",
      },
    });
  });
});
