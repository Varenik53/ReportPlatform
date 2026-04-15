import {
  REPORT_RUN_STATUS,
  mapReportRunDbRow,
  type ReportRun,
  type ReportRunDbRow,
} from "@reportplatform/shared";
import {
  REPORT_RUN_COLUMNS,
  REPORT_RUN_COLUMNS_QUALIFIED,
  getDatabasePool,
} from "@reportplatform/shared/server";

export async function claimNextQueuedReportRun(): Promise<ReportRun | null> {
  const pool = getDatabasePool();
  const result = await pool.query<ReportRunDbRow>(
    `
      WITH candidate AS (
        SELECT id
        FROM report_runs
        WHERE status = '${REPORT_RUN_STATUS.Queued}'
        ORDER BY created_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      UPDATE report_runs AS report_run
      SET status = '${REPORT_RUN_STATUS.Running}', started_at = NOW()
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
      SET status = '${REPORT_RUN_STATUS.Succeeded}',
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
      SET status = '${REPORT_RUN_STATUS.Failed}',
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
