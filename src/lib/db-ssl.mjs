/**
 * Whether a Postgres connection needs TLS, and on what terms.
 *
 * Shared by the app (src/lib/db.ts) and the migration script so the two can't
 * disagree about how to reach the same database.
 *
 *  - Local sockets and loopback: no TLS, so a plain local Postgres works.
 *  - Railway's private network (*.railway.internal): no TLS; the traffic never
 *    leaves the project's network and the server doesn't offer it.
 *  - Anything else, including Railway's public proxy: TLS, but without chain
 *    verification — managed providers routinely present certificates that
 *    don't chain to a public root.
 */
export function sslConfigFor(connectionString) {
  let url;
  try {
    url = new URL(connectionString);
  } catch {
    return undefined;
  }

  const sslmode = url.searchParams.get("sslmode");
  if (sslmode === "disable") return undefined;
  // A `host=` parameter means a Unix socket, which is never TLS.
  if (url.searchParams.has("host")) return undefined;

  const host = url.hostname;
  const isLocal =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host === "" ||
    host.endsWith(".railway.internal");

  if (isLocal) return undefined;
  return { rejectUnauthorized: false };
}
