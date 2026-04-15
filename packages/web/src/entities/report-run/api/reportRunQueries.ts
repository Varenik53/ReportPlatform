import { queryOptions } from "@tanstack/react-query";
import { fetchReportRuns } from "./reportRunApi";

const POLL_INTERVAL_MS = 5_000;

export const reportRunQueries = {
  all: () =>
    queryOptions({
      queryKey: ["report-runs"],
      queryFn: fetchReportRuns,
      refetchInterval: POLL_INTERVAL_MS,
    }),
} as const;
