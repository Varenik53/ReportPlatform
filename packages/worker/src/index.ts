import { getAvailableReports } from "@reportplatform/reports";
import { closeDatabasePool } from "@reportplatform/shared/server";

import { pollIntervalMs, storageDir } from "./config.js";
import { processQueue, requestShutdown, waitUntilIdle } from "./queue.processor.js";

function startWorker(): void {
  console.log("[worker] bootstrap started");
  console.log(
    `[worker] registered reports: ${getAvailableReports()
      .map((report) => report.key)
      .join(", ")}`,
  );
  console.log(`[worker] storage directory: ${storageDir}`);

  const pollTimer = setInterval(() => {
    void processQueue();
  }, pollIntervalMs);

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[worker] ${signal} received, shutting down…`);
    clearInterval(pollTimer);
    requestShutdown();
    try {
      await waitUntilIdle();
      console.log("[worker] queue idle, closing database pool…");
      await closeDatabasePool();
      console.log("[worker] shutdown complete");
      process.exit(0);
    } catch (error) {
      console.error("[worker] error during shutdown", error);
      process.exit(1);
    }
  };

  process.once("SIGTERM", () => void shutdown("SIGTERM"));
  process.once("SIGINT", () => void shutdown("SIGINT"));

  void processQueue();
}

startWorker();
