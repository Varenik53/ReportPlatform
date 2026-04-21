import { describe, expect, it } from "vitest";

import { normalizeParams } from "./params.js";

describe("normalizeParams", () => {
  it("returns an empty object for non-record values", () => {
    expect(normalizeParams(null)).toEqual({});
    expect(normalizeParams("value")).toEqual({});
    expect(normalizeParams([1, 2, 3])).toEqual({});
  });

  it("stringifies record values", () => {
    expect(
      normalizeParams({
        period: "2026-01",
        days: 7,
        enabled: true,
      }),
    ).toEqual({
      period: "2026-01",
      days: "7",
      enabled: "true",
    });
  });
});
