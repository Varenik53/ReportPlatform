import { Chip, Grid, Paper, Stack, Typography } from "@mui/material";

import type { ReportDescriptor } from "../shared/api/types";

interface ReportsListProps {
  reports: ReportDescriptor[];
}

export function ReportsList({ reports }: ReportsListProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
        <Typography variant="subtitle1" fontWeight={600}>
          Available reports
        </Typography>
        <Chip label={reports.length} size="small" color="default" sx={{ fontWeight: 600 }} />
      </Stack>

      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        {reports.map((report) => (
          <Grid size={{ xs: 12, sm: 6 }} key={report.key}>
            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
              <Typography variant="subtitle2" fontWeight={600}>
                {report.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {report.description}
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
                {report.formats.map((format) => (
                  <Chip
                    key={format}
                    label={format.toUpperCase()}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
