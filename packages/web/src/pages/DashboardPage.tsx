import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Box, Grid, Paper, Stack, Typography } from "@mui/material";

import { createReportRun, fetchReportRuns, fetchReports } from "../shared/api/client";
import type { CreateRunPayload, ReportDescriptor, ReportRun } from "../shared/api/types";
import { ReportsList } from "../widgets/ReportsList";
import { RunForm } from "../widgets/RunForm";
import { RunsList } from "../widgets/RunsList";

export function DashboardPage() {
  const [reports, setReports] = useState<ReportDescriptor[]>([]);
  const [runs, setRuns] = useState<ReportRun[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refreshRuns = useCallback(async () => {
    try {
      const runsData = await fetchReportRuns();
      setRuns(runsData);
      setErrorMessage(null);
    } catch {
      setErrorMessage(
        "Runs endpoint is not available yet. Implement API lifecycle endpoints to enable full flow.",
      );
    }
  }, []);

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const [reportsData] = await Promise.all([fetchReports(), refreshRuns()]);
      setReports(reportsData);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [refreshRuns]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshRuns();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [refreshRuns]);

  const sortedRuns = useMemo(
    () =>
      [...runs].sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
      ),
    [runs],
  );

  async function handleCreateRun(payload: CreateRunPayload): Promise<void> {
    const createdRun = await createReportRun(payload);
    if (!createdRun) {
      throw new Error("API did not return created run.");
    }

    setRuns((currentRuns) => [createdRun, ...currentRuns]);
    setErrorMessage(null);
  }

  return (
    <Box
      sx={{
        mx: "auto",
        minHeight: "100vh",
        width: "100%",
        maxWidth: 1100,
        px: { xs: 2, sm: 3 },
        py: { xs: 3, sm: 4 },
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: 1,
          color: "common.white",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <Typography variant="h4" sx={{ mt: 0.5, fontWeight: 700 }}>
          Report Platform
        </Typography>
        <Typography sx={{ mt: 1.5, maxWidth: 720, color: "grey.200" }}>
          Trigger async report runs, track status changes and download generated files.
        </Typography>
      </Paper>

      <Grid container spacing={2} sx={{ mt: 0.5 }}>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={2}>
            <RunForm reports={reports} disabled={isLoading} onSubmit={handleCreateRun} />
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>
                Quick stats
              </Typography>
              <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                <Grid size={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
                    <Typography variant="caption" color="text.secondary">
                      Reports
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {reports.length}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid size={6}>
                  <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "grey.50" }}>
                    <Typography variant="caption" color="text.secondary">
                      Runs
                    </Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {runs.length}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Paper>
          </Stack>
        </Grid>

        <Grid size={{ xs: 12, lg: 8 }}>
          <Stack spacing={2}>
            {errorMessage ? <Alert severity="warning">{errorMessage}</Alert> : null}
            <ReportsList reports={reports} />
            <RunsList runs={sortedRuns} />
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
