import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Grid, Stack } from "@mui/material";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";

import { reportQueries } from "@/entities/report";
import { createReportRun, deleteReportRun, reportRunQueries } from "@/entities/report-run";
import type { CreateRunPayload } from "@/entities/report-run";
import { CreateRunForm } from "@/features/create-run";
import { PageBanner } from "@/shared/ui";
import { DashboardStats } from "@/widgets/dashboard-stats";
import { ReportsList } from "@/widgets/reports-list";
import { RunsList } from "@/widgets/runs-list";

export function DashboardPage() {
  const queryClient = useQueryClient();

  const {
    data: reports = [],
    isLoading: reportsLoading,
    error: reportsError,
  } = useQuery(reportQueries.all());

  const {
    data: runs = [],
    isLoading: runsLoading,
    error: runsError,
  } = useQuery(reportRunQueries.all());

  const isLoading = reportsLoading || runsLoading;
  const errorMessage = reportsError?.message ?? runsError?.message ?? null;

  const createRunMutation = useMutation({
    mutationFn: (payload: CreateRunPayload) => createReportRun(payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["report-runs"] });
    },
  });

  const deleteRunMutation = useMutation({
    mutationFn: (runId: string) => deleteReportRun(runId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["report-runs"] });
    },
  });

  async function handleCreateRun(payload: CreateRunPayload): Promise<void> {
    const createdRun = await createRunMutation.mutateAsync(payload);
    if (!createdRun) {
      throw new Error("API не вернул созданный запуск.");
    }
  }

  function handleDeleteRun(runId: string): void {
    deleteRunMutation.mutate(runId);
  }

  const sortedRuns = useMemo(
    () =>
      [...runs].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [runs],
  );

  return (
    <>
      <a className="skip-link" href="#main-content">
        Перейти к содержимому
      </a>
      <Box
        component="main"
        id="main-content"
        aria-label="Панель управления отчетами"
        sx={{
          mx: "auto",
          minHeight: "100vh",
          width: "100%",
          maxWidth: 1100,
          px: { xs: 2, sm: 3 },
          py: { xs: 3, sm: 4 },
        }}
      >
        <PageBanner
          icon={<AssessmentOutlinedIcon />}
          title="Платформа отчетов"
          description="Запускайте формирование отчетов асинхронно, отслеживайте статусы и скачивайте готовые файлы."
        />

        <Grid container spacing={2} sx={{ mt: 2 }}>
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={2}>
              <CreateRunForm reports={reports} disabled={isLoading} onSubmit={handleCreateRun} />
              <DashboardStats reportsCount={reports.length} runsCount={runs.length} />
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={2}>
              {errorMessage ? (
                <Alert severity="warning" role="status" aria-live="polite">
                  {errorMessage}
                </Alert>
              ) : null}
              <ReportsList reports={reports} />
              <RunsList
                runs={sortedRuns}
                onDeleteRun={handleDeleteRun}
                deletingRunId={
                  deleteRunMutation.isPending ? (deleteRunMutation.variables ?? null) : null
                }
              />
            </Stack>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
