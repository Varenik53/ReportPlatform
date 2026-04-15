import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";

import { iconSize } from "@/shared/config";
import type { ReportDescriptor } from "../model/types";

interface ReportCardProps {
  report: ReportDescriptor;
}

export function ReportCard({ report }: ReportCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{ p: 2, height: "100%" }}
      aria-labelledby={`report-title-${report.key}`}
    >
      <Stack direction="row" alignItems="flex-start" spacing={1.5}>
        <Box
          sx={{
            p: 0.75,
            borderRadius: 2,
            bgcolor: "primary.main",
            color: "white",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <DescriptionOutlinedIcon sx={{ fontSize: iconSize.md }} />
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography id={`report-title-${report.key}`} variant="subtitle2">
            {report.name}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {report.description}
          </Typography>
        </Box>
      </Stack>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
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
  );
}
