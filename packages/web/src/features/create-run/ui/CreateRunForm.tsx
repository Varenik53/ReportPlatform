import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, MenuItem, TextField, Typography } from "@mui/material";
import PlayArrowOutlinedIcon from "@mui/icons-material/PlayArrowOutlined";
import AutoFixHighOutlinedIcon from "@mui/icons-material/AutoFixHighOutlined";
import SendOutlinedIcon from "@mui/icons-material/SendOutlined";

import { typography } from "@/shared/config";
import { SectionHeader, SectionPanel } from "@/shared/ui";
import type { ReportDescriptor, ReportFormat } from "@/entities/report";
import type { CreateRunPayload } from "@/entities/report-run";

interface CreateRunFormProps {
  reports: ReportDescriptor[];
  disabled: boolean;
  onSubmit: (payload: CreateRunPayload) => Promise<void>;
}

function buildTestParams(reportKey: string): Record<string, string | number | boolean> {
  switch (reportKey) {
    case "sales-summary":
      return {
        periodFrom: "2026-01-01",
        periodTo: "2026-01-31",
        region: "EU",
      };
    case "weather-brief":
      return {
        city: "Berlin",
        days: 7,
        units: "metric",
      };
    default:
      return {
        demo: "value",
      };
  }
}

export function CreateRunForm({ reports, disabled, onSubmit }: CreateRunFormProps) {
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

  function parseParams(): Record<string, string> | null {
    if (!paramsText.trim()) {
      return {};
    }

    try {
      const parsed = JSON.parse(paramsText) as unknown;
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        return null;
      }

      return Object.entries(parsed as Record<string, unknown>).reduce<Record<string, string>>(
        (acc, [key, value]) => {
          acc[key] = String(value);
          return acc;
        },
        {},
      );
    } catch {
      return null;
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    if (!reportKey || !format) {
      setSubmitError("Сначала выберите отчет и формат.");
      return;
    }

    const params = parseParams();
    if (params === null) {
      setSubmitError("Параметры должны быть корректным JSON-объектом.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ reportKey, format, params });
      setParamsText("");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не удалось создать запуск.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleGenerateTestParams(): void {
    if (!reportKey) {
      return;
    }

    const sampleParams = buildTestParams(reportKey);
    setParamsText(JSON.stringify(sampleParams, null, 2));
    setSubmitError(null);
  }

  return (
    <SectionPanel titleId="run-form-title">
      <SectionHeader
        icon={<PlayArrowOutlinedIcon />}
        title="Запуск отчета"
        titleId="run-form-title"
      />
      <Typography id="run-form-description" variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        Запустите асинхронное формирование отчета с необязательными JSON-параметрами.
      </Typography>

      <Box
        component="form"
        aria-describedby="run-form-description"
        aria-busy={isSubmitting}
        sx={{ mt: 2, display: "grid", gap: 1.5 }}
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
      >
        <TextField
          select
          label="Отчет"
          size="small"
          value={reportKey}
          onChange={(event) => {
            setReportKey(event.target.value);
            setSubmitError(null);
          }}
          required
          disabled={disabled || reports.length === 0}
        >
          {reports.length === 0 ? (
            <MenuItem value="">Нет доступных отчетов</MenuItem>
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
          label="Формат"
          size="small"
          value={format}
          onChange={(event) => {
            setFormat(event.target.value as ReportFormat);
            setSubmitError(null);
          }}
          required
          disabled={disabled || !selectedReport}
        >
          {(selectedReport?.formats ?? []).map((entry) => (
            <MenuItem key={entry} value={entry}>
              {entry.toUpperCase()}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Параметры (JSON)"
          multiline
          minRows={4}
          value={paramsText}
          onChange={(event) => setParamsText(event.target.value)}
          placeholder='{"period":"2025-01"}'
          helperText='Пример: {"period":"2025-01"}'
          slotProps={{ htmlInput: { style: { fontFamily: typography.fontFamily.mono } } }}
        />

        {submitError ? (
          <Alert severity="error" role="alert" aria-live="assertive">
            {submitError}
          </Alert>
        ) : null}

        <Button
          type="button"
          fullWidth
          variant="outlined"
          startIcon={<AutoFixHighOutlinedIcon />}
          onClick={handleGenerateTestParams}
          disabled={disabled || isSubmitting || reports.length === 0 || !reportKey}
        >
          Сгенерировать тестовые параметры
        </Button>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          startIcon={<SendOutlinedIcon />}
          disabled={disabled || isSubmitting || reports.length === 0}
        >
          {isSubmitting ? "Создание..." : "Создать запуск"}
        </Button>
      </Box>
    </SectionPanel>
  );
}
