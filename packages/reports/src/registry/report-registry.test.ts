import { describe, expect, it } from "vitest";

import { getAvailableReports, getReportHandlerByKey, getReportHandlers } from "../index.js";

describe("report registry", () => {
  it("exposes unique report keys and the same number of handlers and descriptors", () => {
    const reports = getAvailableReports();
    const handlers = getReportHandlers();

    expect(reports.length).toBeGreaterThanOrEqual(2);
    expect(handlers).toHaveLength(reports.length);
    expect(new Set(reports.map((report) => report.key)).size).toBe(reports.length);
  });

  it("returns handlers by key", () => {
    for (const report of getAvailableReports()) {
      const handler = getReportHandlerByKey(report.key);

      expect(handler).toBeDefined();
      expect(handler?.descriptor.key).toBe(report.key);
    }

    expect(getReportHandlerByKey("missing-report")).toBeUndefined();
  });
});
