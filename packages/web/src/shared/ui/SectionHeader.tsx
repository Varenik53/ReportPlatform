import type { ReactElement } from "react";
import { Chip, Stack, Typography } from "@mui/material";

import { iconSize, typography } from "@/shared/config";

interface SectionHeaderProps {
  icon: ReactElement;
  title: string;
  titleId: string;
  count?: number;
  countColor?: "primary" | "secondary";
}

export function SectionHeader({
  icon,
  title,
  titleId,
  count,
  countColor = "primary",
}: SectionHeaderProps) {
  const iconElement = (
    <span style={{ display: "flex", fontSize: iconSize.md, color: "inherit" }}>{icon}</span>
  );

  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ color: "primary.main" }}>
        {iconElement}
        <Typography component="h2" id={titleId} variant="subtitle1">
          {title}
        </Typography>
      </Stack>
      {count !== undefined ? (
        <Chip
          label={count}
          size="small"
          color={countColor}
          sx={{ fontWeight: typography.fontWeight.semibold }}
          aria-label={`${title}: ${count}`}
        />
      ) : null}
    </Stack>
  );
}
