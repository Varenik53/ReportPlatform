import type { ReactNode } from "react";
import { Paper } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

interface SectionPanelProps {
  titleId: string;
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export function SectionPanel({ titleId, children, sx }: SectionPanelProps) {
  return (
    <Paper component="section" aria-labelledby={titleId} variant="outlined" sx={{ p: 2, ...sx }}>
      {children}
    </Paper>
  );
}
