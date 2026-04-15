import { Pool } from "pg";

let databasePool: Pool | null = null;

export function getDatabasePool(): Pool {
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

export const REPORT_RUN_COLUMNS = `
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

export const REPORT_RUN_COLUMNS_QUALIFIED = `
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
