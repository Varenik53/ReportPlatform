import { Button, Chip, IconButton, Paper, Stack, Tooltip, Typography } from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import HourglassEmptyOutlinedIcon from "@mui/icons-material/HourglassEmptyOutlined";
import SyncOutlinedIcon from "@mui/icons-material/SyncOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { REPORT_RUN_STATUS } from "@reportplatform/shared";

import { iconSize, typography } from "@/shared/config";
import { formatDate } from "@/shared/lib";
import type { ReportRun, ReportRunStatus } from "../model/types";
import { getRunDownloadUrl } from "../api/reportRunApi";
import { formatStatusLabel, statusSeverity } from "../lib/status";

function StatusIcon({ status }: { status: ReportRunStatus }) {
  const sx = { fontSize: iconSize.xs };
  switch (status) {
    case REPORT_RUN_STATUS.Queued:
      return <HourglassEmptyOutlinedIcon sx={sx} />;
    case REPORT_RUN_STATUS.Running:
      return (
        <SyncOutlinedIcon
          sx={{
            ...sx,
            "@keyframes spin": { to: { transform: "rotate(360deg)" } },
            animation: "spin 1.5s linear infinite",
          }}
        />
      );
    case REPORT_RUN_STATUS.Succeeded:
      return <CheckCircleOutlineIcon sx={sx} />;
    case REPORT_RUN_STATUS.Failed:
      return <ErrorOutlineIcon sx={sx} />;
    default:
      return null;
  }
}

interface RunCardProps {
  run: ReportRun;
  reportNameMap?: ReadonlyMap<string, string>;
  onDelete?: (runId: string) => void;
  isDeleting?: boolean;
}

export function RunCard({ run, reportNameMap, onDelete, isDeleting }: RunCardProps) {
  return (
    <Paper component="li" variant="outlined" sx={{ p: 2 }} aria-labelledby={`run-title-${run.id}`}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography
          id={`run-title-${run.id}`}
          variant="caption"
          sx={{ fontFamily: typography.fontFamily.mono, fontSize: typography.fontSize.xs }}
          color="text.secondary"
        >
          {run.id}
        </Typography>
        <Stack direction="row" alignItems="center" gap={0.5}>
          <Chip
            icon={<StatusIcon status={run.status} />}
            label={formatStatusLabel(run.status)}
            color={statusSeverity(run.status)}
            size="small"
            sx={{ pl: 0.5 }}
            aria-label={`Статус запуска: ${formatStatusLabel(run.status)}`}
          />
          {onDelete ? (
            <Tooltip
              title={
                run.status === REPORT_RUN_STATUS.Succeeded
                  ? "Удалить запуск"
                  : "Удалить можно только сгенерированный отчет"
              }
            >
              <span>
                <IconButton
                  size="small"
                  color="error"
                  disabled={isDeleting || run.status !== REPORT_RUN_STATUS.Succeeded}
                  onClick={() => onDelete(run.id)}
                  aria-label={`Удалить запуск ${run.id}`}
                >
                  <DeleteOutlineIcon sx={{ fontSize: iconSize.xs }} />
                </IconButton>
              </span>
            </Tooltip>
          ) : null}
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1.5 }}>
        <Typography variant="body2">
          <Typography component="span" variant="caption" color="text.secondary">
            Отчет:
          </Typography>{" "}
          {reportNameMap?.get(run.reportKey) ?? run.reportKey}
        </Typography>
        <Typography variant="body2">
          <Typography component="span" variant="caption" color="text.secondary">
            Формат:
          </Typography>{" "}
          {run.format.toUpperCase()}
        </Typography>
        <Typography variant="body2">
          <Typography component="span" variant="caption" color="text.secondary">
            Создан:
          </Typography>{" "}
          {formatDate(run.createdAt)}
        </Typography>
      </Stack>

      {run.status === REPORT_RUN_STATUS.Succeeded ? (
        <Button
          href={getRunDownloadUrl(run.id)}
          variant="contained"
          color="success"
          size="small"
          startIcon={<DownloadOutlinedIcon />}
          sx={{ mt: 2.5 }}
          aria-label={`Скачать файл отчета для запуска ${run.id}`}
        >
          Скачать файл
        </Button>
      ) : null}
    </Paper>
  );
}
