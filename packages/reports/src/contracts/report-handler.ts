import type { ReportDescriptor, ReportFormat, ReportRun } from "@reportplatform/shared";

export interface ReportArtifact {
  fileExtension: ReportFormat;
  content: string;
}

export interface ReportHandler {
  descriptor: ReportDescriptor;
  generate(run: ReportRun): Promise<ReportArtifact>;
}
