// Standalone migration runner: `npm run migrate`.
// Deploys also migrate lazily on the first /admin load, so this is mainly for
// local work and for checking a fresh database from the command line.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { sslConfigFor } from "../src/lib/db-ssl.mjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: sslConfigFor(connectionString),
});
await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    name       TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )
`);

const dir = path.join(process.cwd(), "db", "migrations");
const files = (await readdir(dir)).filter((file) => file.endsWith(".sql")).sort();
const { rows } = await client.query("SELECT name FROM schema_migrations");
const applied = new Set(rows.map((row) => row.name));

for (const file of files) {
  if (applied.has(file)) continue;
  process.stdout.write(`applying ${file}… `);
  try {
    await client.query("BEGIN");
    await client.query(await readFile(path.join(dir, file), "utf8"));
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [file]);
    await client.query("COMMIT");
    console.log("done");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("failed\n", error.message);
    process.exit(1);
  }
}

console.log("Migrations up to date.");
await client.end();
