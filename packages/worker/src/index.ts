import { getAvailableReports } from "@reportplatform/reports";

import { pollIntervalMs, storageDir } from "./config.js";
import { processQueue } from "./queue.processor.js";

function startWorker(): void {
  console.log("[worker] bootstrap started");
  console.log(
    `[worker] registered reports: ${getAvailableReports()
      .map((report) => report.key)
      .join(", ")}`,
  );
  console.log(`[worker] storage directory: ${storageDir}`);

  setInterval(() => {
    void processQueue();
  }, pollIntervalMs);

  void processQueue();
}

startWorker();
