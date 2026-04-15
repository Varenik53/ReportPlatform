import { queryOptions } from "@tanstack/react-query";
import { fetchReports } from "./reportApi";

export const reportQueries = {
  all: () =>
    queryOptions({
      queryKey: ["reports"],
      queryFn: fetchReports,
      staleTime: 60_000,
    }),
} as const;
