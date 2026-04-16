import { claimNextQueuedReportRun, markReportRunFailed } from "./report-runs.repository.js";
import { processReportRun } from "./report-run.processor.js";

let isProcessing = false;
let shutdownRequested = false;
let activePass: Promise<void> = Promise.resolve();

export function requestShutdown(): void {
  shutdownRequested = true;
}

export function waitUntilIdle(): Promise<void> {
  return activePass;
}

export async function processQueue(): Promise<void> {
  if (isProcessing || shutdownRequested) {
    return;
  }

  isProcessing = true;

  const pass = (async () => {
    try {
      while (!shutdownRequested) {
        const queuedRun = await claimNextQueuedReportRun();
        if (!queuedRun) {
          break;
        }

        try {
          console.log(`[worker] processing run ${queuedRun.id}`);
          await processReportRun(queuedRun);
          console.log(`[worker] run ${queuedRun.id} finished`);
        } catch (error) {
          console.error(`[worker] run ${queuedRun.id} failed`, error);
          const message = error instanceof Error ? error.message : "Unknown worker error";
          await markReportRunFailed(queuedRun.id, message);
        }
      }
    } finally {
      isProcessing = false;
    }
  })();

  activePass = pass;
  return pass;
}
