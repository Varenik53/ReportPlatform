import { Grid, Paper, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import RocketLaunchOutlinedIcon from "@mui/icons-material/RocketLaunchOutlined";

import { StatCard } from "@/shared/ui";

interface DashboardStatsProps {
  reportsCount: number;
  runsCount: number;
}

export function DashboardStats({ reportsCount, runsCount }: DashboardStatsProps) {
  return (
    <Paper variant="outlined" role="region" aria-labelledby="quick-stats-title" sx={{ p: 2 }}>
      <Typography component="h2" id="quick-stats-title" variant="subtitle1">
        Быстрая статистика
      </Typography>
      <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
        <Grid size={6}>
          <StatCard
            icon={<DescriptionOutlinedIcon />}
            label="Отчеты"
            value={reportsCount}
            color="primary.main"
          />
        </Grid>
        <Grid size={6}>
          <StatCard
            icon={<RocketLaunchOutlinedIcon />}
            label="Запуски"
            value={runsCount}
            color="secondary.main"
          />
        </Grid>
      </Grid>
    </Paper>
  );
}
