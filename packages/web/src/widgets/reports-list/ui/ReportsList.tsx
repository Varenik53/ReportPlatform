import { Grid } from "@mui/material";
import LibraryBooksOutlinedIcon from "@mui/icons-material/LibraryBooksOutlined";

import { ReportCard } from "@/entities/report";
import type { ReportDescriptor } from "@/entities/report";
import { EmptyState, SectionHeader, SectionPanel } from "@/shared/ui";

interface ReportsListProps {
  reports: ReportDescriptor[];
}

export function ReportsList({ reports }: ReportsListProps) {
  return (
    <SectionPanel titleId="reports-list-title">
      <SectionHeader
        icon={<LibraryBooksOutlinedIcon />}
        title="Доступные отчеты"
        titleId="reports-list-title"
        count={reports.length}
        countColor="primary"
      />

      {reports.length === 0 ? <EmptyState message="Нет доступных отчетов." /> : null}

      <Grid container component="ul" spacing={1.5} sx={{ mt: 0.5, m: 0, p: 0, listStyle: "none" }}>
        {reports.map((report) => (
          <Grid component="li" size={{ xs: 12, sm: 6 }} key={report.key}>
            <ReportCard report={report} />
          </Grid>
        ))}
      </Grid>
    </SectionPanel>
  );
}
