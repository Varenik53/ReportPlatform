export type ReportFormat = "xlsx" | "pdf";

export interface ReportDescriptor {
  key: string;
  name: string;
  description: string;
  formats: ReportFormat[];
}
