import type { ReactElement } from "react";
import { Paper, Stack, Typography } from "@mui/material";

import { palette, iconSize } from "@/shared/config";

interface PageBannerProps {
  icon: ReactElement;
  title: string;
  description?: string;
}

export function PageBanner({ icon, title, description }: PageBannerProps) {
  return (
    <Paper
      component="header"
      elevation={0}
      sx={{
        p: { xs: 2.5, sm: 3 },
        borderRadius: 1,
        color: "common.white",
        background: `linear-gradient(135deg, ${palette.brand.dark} 0%, ${palette.brand.main} 40%, ${palette.brand.light} 100%)`,
        position: "relative",
        overflow: "hidden",
        "&::before": {
          content: '""',
          position: "absolute",
          top: -40,
          right: -40,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: palette.overlay.white6,
        },
        "&::after": {
          content: '""',
          position: "absolute",
          bottom: -60,
          left: "40%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: palette.overlay.white4,
        },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <span style={{ display: "flex", fontSize: iconSize.lg, opacity: 0.9 }}>{icon}</span>
        <Typography component="h1" variant="h4">
          {title}
        </Typography>
      </Stack>
      {description ? (
        <Typography sx={{ mt: 1.5, maxWidth: 720, color: palette.overlay.white80 }}>
          {description}
        </Typography>
      ) : null}
    </Paper>
  );
}
