import { afterEach, describe, expect, it, vi } from "vitest";

import { requestJson, unwrapArray, unwrapEnvelope } from "./base";

describe("shared api helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("throws the server error message from a JSON error payload", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      statusText: "Bad Request",
      json: vi.fn().mockResolvedValue({ error: "Bad payload" }),
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("/api/report-runs")).rejects.toThrow("Bad payload");
  });

  it("returns null for 204 responses", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(requestJson("/api/report-runs/run-1", { method: "DELETE" })).resolves.toBeNull();
  });

  it("unwraps envelopes and arrays safely", () => {
    expect(unwrapEnvelope<{ id: string }>({ success: true, data: { id: "run-1" } })).toEqual({
      id: "run-1",
    });
    expect(
      unwrapEnvelope<{ runs: number[] }>({ success: true, data: { runs: [1, 2] } }, "runs"),
    ).toEqual([1, 2]);
    expect(unwrapEnvelope({ success: true })).toBeNull();
    expect(unwrapArray({ success: true, data: { runs: ["run-1"] } }, "runs")).toEqual(["run-1"]);
    expect(unwrapArray({ success: false }, "runs")).toEqual([]);
  });
});
