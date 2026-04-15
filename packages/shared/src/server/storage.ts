import { existsSync } from "node:fs";
import { access } from "node:fs/promises";
import { dirname, isAbsolute, join, resolve, sep } from "node:path";

function findWorkspaceRoot(startDir: string): string {
  let dir = resolve(startDir);
  for (;;) {
    if (existsSync(join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) {
      return resolve(startDir);
    }
    dir = parent;
  }
}

/**
 * Shared directory for generated report files (api download + worker writes).
 *
 * - If `STORAGE_DIR` is set and absolute, it is used as-is (Docker, custom mounts).
 * - If `STORAGE_DIR` is relative (e.g. `./storage` in root `.env`), it is resolved from the
 *   monorepo workspace root so `pnpm` scripts running in `packages/api` and `packages/worker`
 *   still point at the same folder.
 * - If unset, defaults to `<workspace root>/storage`.
 */
export function resolveStorageDirectory(): string {
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const fromEnv = process.env.STORAGE_DIR;
  if (fromEnv !== undefined && fromEnv.length > 0) {
    if (isAbsolute(fromEnv)) {
      return resolve(fromEnv);
    }
    return resolve(workspaceRoot, fromEnv);
  }
  return resolve(workspaceRoot, "storage");
}

/**
 * Resolves `relativeFilePath` under `storageRoot` and rejects path traversal outside the root.
 */
export function safeResolveUnderStorageRoot(
  storageRoot: string,
  relativeFilePath: string,
): string | null {
  const rootDirectory = resolve(storageRoot);
  const targetPath = resolve(rootDirectory, relativeFilePath);
  const hasValidPrefix =
    targetPath === rootDirectory || targetPath.startsWith(`${rootDirectory}${sep}`);

  if (!hasValidPrefix) {
    return null;
  }

  return targetPath;
}

/** Older local dev runs wrote artifacts only here (per-package `cwd` + `./storage`). */
const LEGACY_WORKER_STORAGE_SEGMENTS = ["packages", "worker", "storage"] as const;

/**
 * Returns an absolute path to an existing artifact file, or `null`.
 * Checks the canonical storage dir first, then the legacy worker package folder from older setups.
 */
export async function resolveExistingArtifactPath(
  relativeFilePath: string,
): Promise<string | null> {
  const primaryRoot = resolveStorageDirectory();
  const workspaceRoot = findWorkspaceRoot(process.cwd());
  const legacyRoot = join(workspaceRoot, ...LEGACY_WORKER_STORAGE_SEGMENTS);

  const roots: string[] = [primaryRoot];
  if (resolve(primaryRoot) !== resolve(legacyRoot)) {
    roots.push(legacyRoot);
  }

  const seen = new Set<string>();
  for (const root of roots) {
    const absolute = safeResolveUnderStorageRoot(root, relativeFilePath);
    if (absolute === null || seen.has(absolute)) {
      continue;
    }
    seen.add(absolute);
    try {
      await access(absolute);
      return absolute;
    } catch {
      continue;
    }
  }

  return null;
}
