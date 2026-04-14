import { randomUUID } from "node:crypto";

import { Pool, type QueryResult } from "pg";

import type { CreateReportRunInput, ReportRun, ReportRunDbRow } from "@reportplatform/shared";
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

export async function listReportRuns(): Promise<ReportRun[]> {
  const pool: Pool = getDatabasePool();
  const result: QueryResult<ReportRunDbRow> = await pool.query<ReportRunDbRow>(
    `
      SELECT ${REPORT_RUN_COLUMNS}
      FROM report_runs
      ORDER BY created_at DESC
      LIMIT 200
    `,
  );

  return result.rows.map(mapReportRunDbRow);
}

export async function findReportRunById(id: string): Promise<ReportRun | null> {
  const pool: Pool = getDatabasePool();
  const result: QueryResult<ReportRunDbRow> = await pool.query<ReportRunDbRow>(
    `
      SELECT ${REPORT_RUN_COLUMNS}
      FROM report_runs
      WHERE id = $1
      LIMIT 1
    `,
    [id],
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapReportRunDbRow(result.rows[0]);
}

export async function createReportRun(input: CreateReportRunInput): Promise<ReportRun> {
  const pool: Pool = getDatabasePool();
  const paramsJson = JSON.stringify(input.params ?? {});
  const runId = randomUUID();
  const result: QueryResult<ReportRunDbRow> = await pool.query<ReportRunDbRow>(
    `
      INSERT INTO report_runs (id, report_key, format, params_json, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING ${REPORT_RUN_COLUMNS}
    `,
    [runId, input.reportKey, input.format, paramsJson, "queued"],
  );

  return mapReportRunDbRow(result.rows[0]);
}
