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
 * Applies any migration files that haven't run yet, in filename order.
 * Called from `npm run migrate` and once lazily on first admin page load, so a
 * fresh deploy doesn't need a manual step.
 */
export async function migrate(): Promise<string[]> {
  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name       TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const dir = path.join(process.cwd(), "db", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  const applied = new Set(
    (await query<{ name: string }>("SELECT name FROM schema_migrations")).map(
      (row) => row.name,
    ),
  );

  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), "utf8");
    await transaction(async (client) => {
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        file,
      ]);
    });
    ran.push(file);
  }
  return ran;
}
