import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Pool, type QueryResultRow } from "pg";
import { sslConfigFor } from "./db-ssl.mjs";
import { env } from "./env";

// Next reloads modules on every request in dev; without the global the pool
// would be recreated each time and leak connections.
const globalForPool = globalThis as unknown as { schedulingPool?: Pool };

export function pool(): Pool {
  if (!globalForPool.schedulingPool) {
    globalForPool.schedulingPool = new Pool({
      connectionString: env.databaseUrl,
      max: 5,
      ssl: sslConfigFor(env.databaseUrl),
    });
  }
  return globalForPool.schedulingPool;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await pool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Runs a callback inside a transaction, rolling back on any throw.
 */
export async function transaction<T>(
  fn: (client: import("pg").PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Arbitrary but fixed key for the advisory lock that serialises migrations.
 * Railway can run more than one replica, and they all boot at once.
 */
const MIGRATION_LOCK_KEY = 8_675_309;

/**
 * Applies any migration files that haven't run yet, in filename order.
 *
 * Holds a session-level advisory lock for the duration, so concurrent
 * replicas queue rather than racing to create the same tables.
 */
export async function migrate(): Promise<string[]> {
  const client = await pool().connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_KEY]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const dir = path.join(process.cwd(), "db", "migrations");
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    const { rows } = await client.query<{ name: string }>(
      "SELECT name FROM schema_migrations",
    );
    const applied = new Set(rows.map((row) => row.name));

    const ran: string[] = [];
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = await readFile(path.join(dir, file), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
          file,
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
      ran.push(file);
    }
    return ran;
  } finally {
    await client
      .query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_KEY])
      .catch(() => undefined);
    client.release();
  }
}

// Migrating is idempotent but not free, so each process does it once.
let migrationRun: Promise<string[]> | null = null;

/**
 * Guarantees the schema exists before the first query that depends on it.
 *
 * Every read path calls this rather than assuming a deploy step ran, so a
 * fresh database serves /meet correctly instead of 500ing until someone
 * happens to open /admin. A failure is not cached — the next request retries.
 */
export function ensureMigrated(): Promise<string[]> {
  migrationRun ??= migrate().catch((error) => {
    migrationRun = null;
    throw error;
  });
  return migrationRun;
}
