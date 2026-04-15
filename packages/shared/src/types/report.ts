export type ReportFormat = "xlsx" | "pdf";

export interface ReportFormatMeta {
  mimeType: string;
  extension: string;
}

export const REPORT_FORMAT_META: Record<ReportFormat, ReportFormatMeta> = {
  xlsx: {
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    extension: "xlsx",
  },
  pdf: {
    mimeType: "application/pdf",
    extension: "pdf",
  },
};

export interface ReportDescriptor {
  key: string;
  name: string;
  description: string;
  formats: ReportFormat[];
}
