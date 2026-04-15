import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { getReportHandlerByKey } from "@reportplatform/reports";
import { REPORT_FORMAT_META, type ReportRun } from "@reportplatform/shared";

import { markReportRunFailed, markReportRunSucceeded } from "./report-runs.repository.js";
import { storageDir } from "./config.js";

export async function processReportRun(run: ReportRun): Promise<void> {
  const handler = getReportHandlerByKey(run.reportKey);
  if (!handler) {
    await markReportRunFailed(run.id, `Неизвестный ключ отчёта: ${run.reportKey}`);
    return;
  }

  if (!handler.descriptor.formats.includes(run.format)) {
    await markReportRunFailed(
      run.id,
      `Формат ${run.format} не поддерживается отчётом ${run.reportKey}`,
    );
    return;
  }

  const artifact = await handler.generate(run);

  const { extension } = REPORT_FORMAT_META[run.format];
  const relativeFilePath = `${run.id}.${extension}`;
  const targetFilePath = resolve(storageDir, relativeFilePath);
  const fileName = `${run.reportKey}-${run.id}.${extension}`;

  await mkdir(storageDir, { recursive: true });
  await writeFile(targetFilePath, artifact.content);
  await markReportRunSucceeded(run.id, relativeFilePath, fileName);
}
