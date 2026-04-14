import type { ReportRunStatus } from "./api/types";
import type { AlertColor } from "@mui/material";

export function formatStatusLabel(status: ReportRunStatus): string {
  return status[0].toUpperCase() + status.slice(1);
}

export function formatRunDate(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return date.toLocaleString();
}

export function statusSeverity(status: ReportRunStatus): AlertColor {
  switch (status) {
    case "queued":
      return "warning";
    case "running":
      return "info";
    case "succeeded":
      return "success";
    case "failed":
      return "error";
    default:
      return "info";
  }
}
