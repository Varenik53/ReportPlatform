import type { ReportRun } from "@reportplatform/shared";

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
