import { useMemo, useState } from "react";
import { Stack, TablePagination } from "@mui/material";
import PlaylistPlayOutlinedIcon from "@mui/icons-material/PlaylistPlayOutlined";

import { RunCard } from "@/entities/report-run";
import type { ReportRun } from "@/entities/report-run";
import { EmptyState, SectionHeader, SectionPanel } from "@/shared/ui";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25] as const;
const DEFAULT_ROWS_PER_PAGE = 10;

interface RunsListProps {
  runs: ReportRun[];
  reportNameMap?: ReadonlyMap<string, string>;
  onDeleteRun?: (runId: string) => void;
  deletingRunId?: string | null;
}

export function RunsList({ runs, reportNameMap, onDeleteRun, deletingRunId }: RunsListProps) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);

  const pageRuns = useMemo(() => {
    const start = page * rowsPerPage;
    return runs.slice(start, start + rowsPerPage);
  }, [runs, page, rowsPerPage]);

  const safePage = runs.length > 0 ? Math.min(page, Math.ceil(runs.length / rowsPerPage) - 1) : 0;
  if (safePage !== page) {
    setPage(safePage);
  }

  return (
    <SectionPanel titleId="runs-list-title">
      <SectionHeader
        icon={<PlaylistPlayOutlinedIcon />}
        title="Запуски отчетов"
        titleId="runs-list-title"
        count={runs.length > 0 ? runs.length : undefined}
        countColor="secondary"
      />

      {runs.length === 0 ? (
        <EmptyState message="Пока нет запусков. Создайте первый." />
      ) : (
        <>
          <Stack component="ul" spacing={1.5} sx={{ mt: 1.5, m: 0, p: 0, listStyle: "none" }}>
            {pageRuns.map((run) => (
              <RunCard
                key={run.id}
                run={run}
                reportNameMap={reportNameMap}
                onDelete={onDeleteRun}
                isDeleting={deletingRunId === run.id}
              />
            ))}
          </Stack>

          <TablePagination
            component="div"
            count={runs.length}
            page={safePage}
            onPageChange={(_event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[...ROWS_PER_PAGE_OPTIONS]}
            labelRowsPerPage="На странице:"
            labelDisplayedRows={({ from, to, count }) => `${from}–${to} из ${count}`}
            sx={{ mt: 1, borderTop: 1, borderColor: "divider" }}
          />
        </>
      )}
    </SectionPanel>
  );
}
