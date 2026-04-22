import type { ReportDescriptor, ReportFormat, ReportRun } from "@reportplatform/shared";

/**
 * Результат генерации отчёта, возвращаемый {@link ReportHandler}.
 *
 * Воркер сохраняет {@link content} как есть и использует `format` запуска для выбора
 * метаданных файла (расширение, MIME-тип). Обработчики всё равно должны выставлять
 * {@link fileExtension} равным формату запуска для ясности/будущего расширения.
 */
export interface ReportArtifact {
  fileExtension: ReportFormat;
  content: Buffer;
}

/**
 * Контракт одного модуля отчёта.
 *
 * API/UI используют {@link descriptor}, чтобы показывать список отчётов и валидировать формат.
 * Воркер вызывает {@link generate}, чтобы сгенерировать файл для конкретного запуска.
 */
export interface ReportHandler {
  descriptor: ReportDescriptor;

  /**
   * Генерирует артефакт для запуска отчёта.
   *
   * Примечание: `run.params` нормализованы в строки на уровне API.
   */
  generate(run: ReportRun): Promise<ReportArtifact>;
}
