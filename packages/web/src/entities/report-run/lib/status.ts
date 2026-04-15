import type { AlertColor } from "@mui/material";
import { REPORT_RUN_STATUS } from "@reportplatform/shared";
import type { ReportRunStatus } from "../model/types";

export function formatStatusLabel(status: ReportRunStatus): string {
  switch (status) {
    case REPORT_RUN_STATUS.Queued:
      return "В очереди";
    case REPORT_RUN_STATUS.Running:
      return "Выполняется";
    case REPORT_RUN_STATUS.Succeeded:
      return "Успешно";
    case REPORT_RUN_STATUS.Failed:
      return "Ошибка";
    default:
      return status;
  }
}

export function statusSeverity(status: ReportRunStatus): AlertColor {
  switch (status) {
    case REPORT_RUN_STATUS.Queued:
      return "warning";
    case REPORT_RUN_STATUS.Running:
      return "info";
    case REPORT_RUN_STATUS.Succeeded:
      return "success";
    case REPORT_RUN_STATUS.Failed:
      return "error";
    default:
      return "info";
  }
}
