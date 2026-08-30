import { query, queryOne } from "../db";
import { GoogleCalendarProvider } from "./google";
import { ZohoCalendarProvider } from "./zoho";
import type { CalendarProvider, ConnectionRow } from "./types";

export * from "./types";
export { GoogleCalendarProvider, GOOGLE_CALENDAR_SCOPES, GOOGLE_LOGIN_SCOPES } from "./google";
export { ZohoCalendarProvider, ZOHO_SCOPES } from "./zoho";

export function providerFor(row: ConnectionRow): CalendarProvider {
  switch (row.provider) {
    case "google":
      return new GoogleCalendarProvider(row);
    case "zoho":
      return new ZohoCalendarProvider(row);
    default: {
      // Exhaustiveness guard: adding a provider to the union without a case
      // here becomes a compile error rather than a runtime surprise.
      const unreachable: never = row.provider;
      throw new Error(`Unsupported provider ${unreachable}`);
    }
  }
}

export async function listConnections(): Promise<ConnectionRow[]> {
  return query<ConnectionRow>(
    "SELECT * FROM connections ORDER BY provider, account_email",
  );
}

export async function getConnection(id: string): Promise<ConnectionRow | null> {
  return queryOne<ConnectionRow>("SELECT * FROM connections WHERE id = $1", [id]);
}

/**
 * The first Google connection on file. Used to mint Meet links for bookings
 * whose host calendar lives somewhere that can't make one itself (Zoho).
 */
export async function anyGoogleConnection(): Promise<ConnectionRow | null> {
  return queryOne<ConnectionRow>(
    "SELECT * FROM connections WHERE provider = 'google' ORDER BY created_at LIMIT 1",
  );
}
