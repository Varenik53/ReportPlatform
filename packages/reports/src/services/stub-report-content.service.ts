import type { ReportRun } from "@reportplatform/shared";

/**
 * Генерирует текстовую заглушку содержимого отчёта.
 *
 * @used-by scripts/generate-report-handler.mjs — подставляется в сгенерированные обработчики отчётов
 */
export function buildStubReportContent(reportName: string, run: ReportRun): string {
  return [
    `Отчёт: ${reportName}`,
    `ID запуска: ${run.id}`,
    `Формат: ${run.format}`,
    `Создан: ${run.createdAt}`,
    `Параметры: ${JSON.stringify(run.params)}`,
    "",
    "Сгенерировано заглушкой обработчика отчётов (MVP-демо).",
  ].join("\n");
}
