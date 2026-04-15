import { parseIntEnv } from "@reportplatform/shared";
import { resolveStorageDirectory } from "@reportplatform/shared/server";

export const pollIntervalMs = parseIntEnv(process.env.WORKER_POLL_INTERVAL_MS, 5000);
export const storageDir = resolveStorageDirectory();
