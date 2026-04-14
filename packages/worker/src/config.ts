import { resolve } from "node:path";

import { getPort } from "@reportplatform/shared";

export const pollIntervalMs = getPort(process.env.WORKER_POLL_INTERVAL_MS, 5000);
export const storageDir = process.env.STORAGE_DIR
  ? resolve(process.env.STORAGE_DIR)
  : resolve(process.cwd(), "storage");
