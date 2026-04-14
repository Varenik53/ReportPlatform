import { claimNextQueuedReportRun, markReportRunFailed } from "./report-runs.repository.js";
import { processReportRun } from "./report-run.processor.js";

let isProcessing = false;

export async function processQueue(): Promise<void> {
  if (isProcessing) {
    return;
  }

  isProcessing = true;

  try {
    while (true) {
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
}
