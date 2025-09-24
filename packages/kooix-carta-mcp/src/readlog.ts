import fs from "node:fs/promises";
import path from "node:path";
import { AppendReadLogRequest, AuditMode } from "./types.js";
import { internalError } from "./errors.js";

const LOGS_DIR = ".kooix/logs";
const JSONL_FILE = "readlog.jsonl";
const SQLITE_FILE = "readlog.sqlite";

let sqliteInstance: any;

async function ensureJsonl(baseRoot: string): Promise<string> {
  const dir = path.join(baseRoot, LOGS_DIR);
  await fs.mkdir(dir, { recursive: true });
  return path.join(dir, JSONL_FILE);
}

async function getSqlite(baseRoot: string): Promise<any> {
  if (sqliteInstance) {
    return sqliteInstance;
  }

  let Database;
  try {
    ({ default: Database } = await import("better-sqlite3"));
  } catch (error) {
    throw internalError(
      "SQLite audit mode requires optional dependency better-sqlite3",
      { cause: error instanceof Error ? error.message : String(error) }
    );
  }

  const dir = path.join(baseRoot, LOGS_DIR);
  await fs.mkdir(dir, { recursive: true });
  const dbPath = path.join(dir, SQLITE_FILE);
  sqliteInstance = new Database(dbPath);
  sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS reads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts TEXT NOT NULL,
      runId TEXT NOT NULL,
      path TEXT NOT NULL,
      sha256 TEXT NOT NULL
    );
  `);
  return sqliteInstance;
}

export async function appendRead(baseRoot: string, mode: AuditMode, request: AppendReadLogRequest): Promise<{ ok: true }> {
  if (mode === "none") {
    return { ok: true };
  }

  const entry = {
    ts: new Date().toISOString(),
    runId: request.runId,
    path: request.path,
    sha256: request.sha256,
  };

  if (mode === "jsonl") {
    const filePath = await ensureJsonl(baseRoot);
    await fs.appendFile(filePath, `${JSON.stringify(entry)}\n`, "utf8");
    return { ok: true };
  }

  if (mode === "sqlite") {
    const db = await getSqlite(baseRoot);
    const stmt = db.prepare(
      "INSERT INTO reads (ts, runId, path, sha256) VALUES (@ts, @runId, @path, @sha256)"
    );
    stmt.run(entry);
    return { ok: true };
  }

  throw internalError(`Unsupported audit mode: ${mode}`);
}
