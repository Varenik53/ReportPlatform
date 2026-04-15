import type { ReactElement } from "react";
import { Paper, Stack, Typography } from "@mui/material";

import { palette, iconSize } from "@/shared/config";

interface StatCardProps {
  icon: ReactElement;
  label: string;
  value: number | string;
  color: string;
}

export function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 1.5, bgcolor: color, borderColor: "transparent", color: "white" }}
    >
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <span style={{ display: "flex", fontSize: iconSize.sm, opacity: 0.85 }}>{icon}</span>
        <Typography variant="caption" sx={{ color: palette.overlay.white85 }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ mt: 0.5 }} aria-live="polite">
        {value}
      </Typography>
    </Paper>
  );
}
