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
 * Общая директория для сгенерированных файлов отчётов (скачивание в API + запись воркером).
 *
 * - Если `STORAGE_DIR` задан и является абсолютным путём — используется как есть (Docker, кастомные монтирования).
 * - Если `STORAGE_DIR` относительный (например `./storage` в корневом `.env`) — резолвится от корня монорепозитория,
 *   чтобы скрипты `pnpm`, запущенные из `packages/api` и `packages/worker`, указывали на одну и ту же папку.
 * - Если переменная не задана — по умолчанию `<корень монорепозитория>/storage`.
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
 * Резолвит `relativeFilePath` внутри `storageRoot` и защищает от выхода за пределы корня (path traversal).
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

/** В старых локальных запусках артефакты писались только сюда (`cwd` пакета + `./storage`). */
const LEGACY_WORKER_STORAGE_SEGMENTS = ["packages", "worker", "storage"] as const;

/**
 * Возвращает абсолютный путь к существующему файлу артефакта или `null`.
 * Сначала проверяет каноническую директорию storage, затем — legacy-папку воркера из старых конфигураций.
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
