import type { ReportDescriptor, ReportFormat, ReportRun } from "@reportplatform/shared";

export interface ReportArtifact {
  fileExtension: ReportFormat;
  content: Buffer;
}

export interface ReportHandler {
  descriptor: ReportDescriptor;
  generate(run: ReportRun): Promise<ReportArtifact>;
}
