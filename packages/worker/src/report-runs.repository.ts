import { Pool } from "pg";

import type { ReportRun, ReportRunDbRow } from "@reportplatform/shared";
import { mapReportRunDbRow } from "@reportplatform/shared";

let databasePool: Pool | null = null;

const REPORT_RUN_COLUMNS = `
  id,
  report_key,
  format,
  status,
  created_at,
  params_json,
  started_at,
  finished_at,
  file_path,
  file_name,
  error_message
`;

const REPORT_RUN_COLUMNS_QUALIFIED = `
  report_run.id,
  report_run.report_key,
  report_run.format,
  report_run.status,
  report_run.created_at,
  report_run.params_json,
  report_run.started_at,
  report_run.finished_at,
  report_run.file_path,
  report_run.file_name,
  report_run.error_message
`;

function getDatabasePool(): Pool {
  if (databasePool !== null) {
    return databasePool;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  databasePool = new Pool({ connectionString });
  return databasePool;
}

export async function claimNextQueuedReportRun(): Promise<ReportRun | null> {
  const pool = getDatabasePool();
  const result = await pool.query<ReportRunDbRow>(
    `
      WITH candidate AS (
        SELECT id
        FROM report_runs
        WHERE status = 'queued'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE report_runs AS report_run
      SET status = 'running', started_at = NOW()
      FROM candidate
      WHERE report_run.id = candidate.id
      RETURNING ${REPORT_RUN_COLUMNS_QUALIFIED}
    `,
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapReportRunDbRow(result.rows[0]);
}

export async function markReportRunSucceeded(
  id: string,
  filePath: string,
  fileName: string,
): Promise<ReportRun | null> {
  const pool = getDatabasePool();
  const result = await pool.query<ReportRunDbRow>(
    `
      UPDATE report_runs
      SET status = 'succeeded',
          finished_at = NOW(),
          file_path = $2,
          file_name = $3,
          error_message = NULL
      WHERE id = $1
      RETURNING ${REPORT_RUN_COLUMNS}
    `,
    [id, filePath, fileName],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapReportRunDbRow(result.rows[0]);
}

export async function markReportRunFailed(
  id: string,
  errorMessage: string,
): Promise<ReportRun | null> {
  const pool = getDatabasePool();
  const result = await pool.query<ReportRunDbRow>(
    `
      UPDATE report_runs
      SET status = 'failed',
          finished_at = NOW(),
          error_message = $2
      WHERE id = $1
      RETURNING ${REPORT_RUN_COLUMNS}
    `,
    [id, errorMessage],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapReportRunDbRow(result.rows[0]);
}
