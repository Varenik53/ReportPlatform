import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, MenuItem, Paper, TextField, Typography } from "@mui/material";

import type { CreateRunPayload, ReportDescriptor, ReportFormat } from "../shared/api/types";

interface RunFormProps {
  reports: ReportDescriptor[];
  disabled: boolean;
  onSubmit: (payload: CreateRunPayload) => Promise<void>;
}

export function RunForm({ reports, disabled, onSubmit }: RunFormProps) {
  const [reportKey, setReportKey] = useState<string>("");
  const [format, setFormat] = useState<ReportFormat | "">("");
  const [paramsText, setParamsText] = useState<string>("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (reports.length === 0) {
      setReportKey("");
      setFormat("");
      return;
    }

    if (!reportKey) {
      const firstReport = reports[0];
      setReportKey(firstReport.key);
      setFormat(firstReport.formats[0] ?? "");
    }
  }, [reportKey, reports]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.key === reportKey) ?? null,
    [reportKey, reports],
  );

  useEffect(() => {
    if (!selectedReport) {
      setFormat("");
      return;
    }

    if (selectedReport.formats.includes(format as ReportFormat)) {
      return;
    }

    setFormat(selectedReport.formats[0] ?? "");
  }, [format, selectedReport]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!reportKey || !format) {
      setSubmitError("Select report and format first.");
      return;
    }

    let params: Record<string, string> = {};
    if (paramsText.trim()) {
      try {
        const parsed = JSON.parse(paramsText) as unknown;
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("Params must be an object.");
        }

        params = Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          },
          {},
        );
      } catch {
        setSubmitError("Params must be valid JSON object.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reportKey, format, params });
      setParamsText("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create run.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Run report
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Start an async report run with optional JSON params.
      </Typography>

      <Box
        component="form"
        sx={{ mt: 2, display: "grid", gap: 1.5 }}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <TextField
          select
          label="Report"
          size="small"
          value={reportKey}
          onChange={(event) => {
            setReportKey(event.target.value);
            setSubmitError(null);
          }}
          disabled={disabled || reports.length === 0}
        >
          {reports.length === 0 ? (
            <MenuItem value="">No reports available</MenuItem>
          ) : (
            reports.map((report) => (
              <MenuItem key={report.key} value={report.key}>
                {report.name}
              </MenuItem>
            ))
          )}
        </TextField>

        <TextField
          select
          label="Format"
          size="small"
          value={format}
          onChange={(event) => {
            setFormat(event.target.value as ReportFormat);
            setSubmitError(null);
          }}
          disabled={disabled || !selectedReport}
        >
          {(selectedReport?.formats ?? []).map((entry) => (
            <MenuItem key={entry} value={entry}>
              {entry.toUpperCase()}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Params (JSON)"
          multiline
          minRows={4}
          value={paramsText}
          onChange={(event) => setParamsText(event.target.value)}
          placeholder='{"period":"2025-01"}'
          slotProps={{ htmlInput: { style: { fontFamily: "monospace" } } }}
        />

        {submitError ? <Alert severity="error">{submitError}</Alert> : null}

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={disabled || isSubmitting || reports.length === 0}
        >
          {isSubmitting ? "Creating..." : "Create run"}
        </Button>
      </Box>
    </Paper>
  );
}
