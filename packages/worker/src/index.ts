import { getAvailableReports } from "@reportplatform/reports";
import { getPort } from "@reportplatform/shared";

const pollIntervalMs = getPort(process.env.WORKER_POLL_INTERVAL_MS, 5000);

console.log("[worker] bootstrap started");
console.log(
  `[worker] registered reports: ${getAvailableReports()
    .map((report) => report.key)
    .join(", ")}`,
);

setInterval(() => {
  console.log("[worker] polling queue placeholder");
}, pollIntervalMs);
