import { query } from "./db";
import { encryptSecret } from "./crypto";
import { providerFor, type ConnectionRow } from "./providers";

/**
 * Stores (or refreshes) a connection and syncs its calendar list.
 *
 * Re-connecting an account that's already on file keeps its `blocks_time`
 * choices, so re-authorising after a token expiry doesn't silently re-open
 * calendars the user had turned off.
 */
export async function saveConnection(input: {
  provider: "google" | "zoho";
  accountEmail: string;
  displayName?: string;
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  scopes?: string;
  apiDomain?: string;
}): Promise<ConnectionRow> {
  const id = `${input.provider}:${input.accountEmail.toLowerCase()}`;

  const rows = await query<ConnectionRow>(
    `INSERT INTO connections
       (id, provider, account_email, display_name, access_token, refresh_token,
        expires_at, scopes, api_domain)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (id) DO UPDATE SET
       display_name  = EXCLUDED.display_name,
       access_token  = EXCLUDED.access_token,
       refresh_token = EXCLUDED.refresh_token,
       expires_at    = EXCLUDED.expires_at,
       scopes        = EXCLUDED.scopes,
       api_domain    = EXCLUDED.api_domain,
       updated_at    = now()
     RETURNING *`,
    [
      id,
      input.provider,
      input.accountEmail.toLowerCase(),
      input.displayName ?? null,
      encryptSecret(input.accessToken),
      encryptSecret(input.refreshToken),
      new Date(Date.now() + input.expiresInSeconds * 1000),
      input.scopes ?? null,
      input.apiDomain ?? null,
    ],
  );

  const connection = rows[0];
  await syncCalendars(connection);
  return connection;
}

export async function syncCalendars(connection: ConnectionRow): Promise<void> {
  const calendars = await providerFor(connection).listCalendars();

  for (const calendar of calendars) {
    await query(
      `INSERT INTO calendars
         (connection_id, remote_id, summary, time_zone, is_primary)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (connection_id, remote_id) DO UPDATE SET
         summary    = EXCLUDED.summary,
         time_zone  = EXCLUDED.time_zone,
         is_primary = EXCLUDED.is_primary`,
      [
        connection.id,
        calendar.remoteId,
        calendar.summary,
        calendar.timeZone ?? null,
        calendar.isPrimary,
      ],
    );
  }

  // Drop calendars that have disappeared upstream so the admin list stays true.
  await query(
    `DELETE FROM calendars
      WHERE connection_id = $1 AND remote_id <> ALL($2::text[])`,
    [connection.id, calendars.map((calendar) => calendar.remoteId)],
  );
}
