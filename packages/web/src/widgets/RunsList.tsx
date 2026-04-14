import { Button, Chip, Paper, Stack, Typography } from "@mui/material";

import type { ReportRun } from "../shared/api/types";
import { getRunDownloadUrl } from "../shared/api/client";
import { formatRunDate, formatStatusLabel, statusSeverity } from "../shared/ui";

interface RunsListProps {
  runs: ReportRun[];
}

export function RunsList({ runs }: RunsListProps) {
  if (runs.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle1" fontWeight={600}>
          Report runs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          No runs yet. Start your first one.
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Report runs
        </Typography>
        <Chip label={runs.length} size="small" sx={{ fontWeight: 600 }} />
      </Stack>

      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {runs.map((run) => (
          <Paper key={run.id} variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
              <Typography variant="caption" sx={{ fontFamily: "monospace" }} color="text.secondary">
                {run.id}
              </Typography>
              <Chip
                label={formatStatusLabel(run.status)}
                color={statusSeverity(run.status)}
                size="small"
              />
            </Stack>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={{ xs: 0.5, sm: 2 }}
              sx={{ mt: 1.5 }}
            >
              <Typography variant="body2">
                <Typography component="span" variant="caption" color="text.secondary">
                  Report:
                </Typography>{" "}
                {run.reportKey}
              </Typography>
              <Typography variant="body2">
                <Typography component="span" variant="caption" color="text.secondary">
                  Format:
                </Typography>{" "}
                {run.format.toUpperCase()}
              </Typography>
              <Typography variant="body2">
                <Typography component="span" variant="caption" color="text.secondary">
                  Created at:
                </Typography>{" "}
                {formatRunDate(run.createdAt)}
              </Typography>
            </Stack>

            {run.status === "succeeded" ? (
              <Button
                href={getRunDownloadUrl(run.id)}
                variant="contained"
                color="success"
                size="small"
                sx={{ mt: 1.5 }}
              >
                Download file
              </Button>
            ) : null}
          </Paper>
        ))}
      </Stack>
    </Paper>
  );
}
