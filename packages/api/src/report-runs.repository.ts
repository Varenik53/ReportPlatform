import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { resolve } from "node:path";

import type { Pool, QueryResult } from "pg";

import {
  REPORT_RUN_STATUS,
  mapReportRunDbRow,
  type CreateReportRunInput,
  type ReportRun,
  type ReportRunDbRow,
} from "@reportplatform/shared";
import { REPORT_RUN_COLUMNS, getDatabasePool } from "@reportplatform/shared/server";

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
    [runId, input.reportKey, input.format, paramsJson, REPORT_RUN_STATUS.Queued],
  );

  return mapReportRunDbRow(result.rows[0]);
}

export async function deleteReportRun(id: string, storageDir: string): Promise<boolean> {
  const pool: Pool = getDatabasePool();
  const existing = await pool.query<{ file_path: string | null }>(
    `SELECT file_path FROM report_runs WHERE id = $1`,
    [id],
  );

  if (existing.rows.length === 0) {
    return false;
  }

  const filePath = existing.rows[0].file_path;

  await pool.query(`DELETE FROM report_runs WHERE id = $1`, [id]);

  if (filePath) {
    const fullPath = resolve(storageDir, filePath);
    try {
      await unlink(fullPath);
    } catch {
      console.warn(`[api] could not delete file ${fullPath}, it may have been removed already`);
    }
  }

  return true;
}
