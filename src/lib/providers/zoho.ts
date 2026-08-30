import { query } from "../db";
import { decryptSecret, encryptSecret } from "../crypto";
import { env } from "../env";
import type {
  BusyInterval,
  CalendarProvider,
  ConnectionRow,
  CreateEventInput,
  CreatedEvent,
  RemoteCalendar,
} from "./types";

const CALENDAR_API = "https://calendar.zoho.com/api/v1";

export const ZOHO_SCOPES = [
  "ZohoCalendar.calendar.READ",
  "ZohoCalendar.event.ALL",
  "ZohoCalendar.freebusy.READ",
  "AaaServer.profile.READ",
];

export interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  api_domain?: string;
  scope?: string;
}

export function zohoAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: env.zohoClientId,
    response_type: "code",
    scope: ZOHO_SCOPES.join(","),
    redirect_uri: redirectUri,
    // Zoho only issues a refresh token when both of these are present, and
    // only on the consent screen the user actually clicks through.
    access_type: "offline",
    prompt: "consent",
    state,
  });
  return `${env.zohoAccountsHost}/oauth/v2/auth?${params}`;
}

export async function exchangeZohoCode(
  code: string,
  redirectUri: string,
): Promise<ZohoTokenResponse> {
  const response = await fetch(`${env.zohoAccountsHost}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.zohoClientId,
      client_secret: env.zohoClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  const token = await response.json();
  if (!response.ok || token.error) {
    throw new Error(`Zoho token exchange failed: ${JSON.stringify(token)}`);
  }
  return token;
}

/** The signed-in Zoho account's email, used to label the connection. */
export async function fetchZohoProfile(
  accessToken: string,
): Promise<{ email: string; name?: string }> {
  const response = await fetch(`${env.zohoAccountsHost}/oauth/user/info`, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error(`Zoho profile lookup failed: ${await response.text()}`);
  }
  const data = await response.json();
  return { email: data.Email ?? data.email, name: data.Display_Name ?? data.name };
}

async function accessTokenFor(row: ConnectionRow): Promise<string> {
  const expiresAt = row.expires_at ? row.expires_at.getTime() : 0;
  if (row.access_token && expiresAt > Date.now() + 60_000) {
    return decryptSecret(row.access_token);
  }

  const response = await fetch(`${env.zohoAccountsHost}/oauth/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: decryptSecret(row.refresh_token),
      client_id: env.zohoClientId,
      client_secret: env.zohoClientSecret,
      grant_type: "refresh_token",
    }),
  });
  const token: ZohoTokenResponse & { error?: string } = await response.json();
  if (!response.ok || token.error) {
    throw new Error(
      `Zoho refresh failed for ${row.account_email}: ${JSON.stringify(token)}. Reconnect the account in /admin.`,
    );
  }

  const expiry = new Date(Date.now() + token.expires_in * 1000);
  await query(
    "UPDATE connections SET access_token = $1, expires_at = $2, updated_at = now() WHERE id = $3",
    [encryptSecret(token.access_token), expiry, row.id],
  );
  row.access_token = encryptSecret(token.access_token);
  row.expires_at = expiry;
  return token.access_token;
}

/** Zoho's wire format for instants: 20260830T170000Z, always UTC. */
function toZohoUtc(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`;
}

function fromZohoUtc(value: string): Date {
  // "20260830T170000Z" → "2026-08-30T17:00:00Z"
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?$/.exec(value);
  if (!match) return new Date(value);
  const [, y, mo, d, h, mi, s] = match;
  return new Date(`${y}-${mo}-${d}T${h}:${mi}:${s}Z`);
}

export class ZohoCalendarProvider implements CalendarProvider {
  readonly provider = "zoho" as const;

  constructor(private readonly row: ConnectionRow) {}

  private async request<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = await accessTokenFor(this.row);
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(
        `Zoho API ${init.method ?? "GET"} ${url} → ${response.status}: ${text}`,
      );
    }
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async listCalendars(): Promise<RemoteCalendar[]> {
    const data = await this.request<{
      calendars?: Array<{
        uid: string;
        name: string;
        timezone?: string;
        isdefault?: boolean;
        privilege?: string;
      }>;
    }>(`${CALENDAR_API}/calendars?category=own`);

    return (data.calendars ?? [])
      // Only calendars we can actually write a booking into.
      .filter((calendar) => calendar.privilege === "owner")
      .map((calendar) => ({
        remoteId: calendar.uid,
        summary: calendar.name,
        timeZone: calendar.timezone,
        isPrimary: Boolean(calendar.isdefault),
      }));
  }

  /**
   * Zoho reports availability per *account*, not per calendar, so the
   * `calendarIds` argument is deliberately unused: one call covers every
   * calendar the account has marked "include in free/busy".
   */
  async getBusy(
    _calendarIds: string[],
    from: Date,
    to: Date,
  ): Promise<BusyInterval[]> {
    const params = new URLSearchParams({
      uemail: this.row.account_email,
      sdate: toZohoUtc(from),
      edate: toZohoUtc(to),
      ftype: "eventbased",
    });
    const data = await this.request<{
      freebusy?: Array<{ startTime: string; endTime: string; fbtype?: string }>;
    }>(`${CALENDAR_API}/calendars/freebusy?${params}`);

    return (data.freebusy ?? [])
      .filter((window) => (window.fbtype ?? "busy").toLowerCase() !== "free")
      .map((window) => ({
        start: fromZohoUtc(window.startTime),
        end: fromZohoUtc(window.endTime),
      }));
  }

  async createEvent(input: CreateEventInput): Promise<CreatedEvent> {
    const description = input.meetingUrl
      ? `${input.description}\n\nJoin with Google Meet: ${input.meetingUrl}`
      : input.description;

    // Zoho takes the whole event as a URL-encoded JSON query parameter rather
    // than a request body. That is genuinely the documented interface.
    const eventdata = JSON.stringify({
      title: input.title,
      dateandtime: {
        timezone: input.timeZone,
        start: toZohoUtc(input.start),
        end: toZohoUtc(input.end),
      },
      description,
      location: input.meetingUrl ?? "",
      attendees: [{ email: input.attendee.email, permission: 1 }],
      reminders: [{ action: "email", minutes: -30 }],
    });

    const data = await this.request<{
      events?: Array<{ uid?: string; etag?: string }>;
    }>(
      `${CALENDAR_API}/calendars/${encodeURIComponent(input.calendarId)}/events` +
        `?eventdata=${encodeURIComponent(eventdata)}`,
      { method: "POST" },
    );

    const created = data.events?.[0];
    if (!created?.uid) {
      throw new Error(
        `Zoho created no event: ${JSON.stringify(data)}`,
      );
    }
    return { remoteEventId: created.uid, meetingUrl: input.meetingUrl };
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    // Zoho requires the current etag to accept a delete, so read it first.
    const current = await this.request<{
      events?: Array<{ etag?: string }>;
    }>(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    );
    const etag = current.events?.[0]?.etag;

    await this.request(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      { method: "DELETE", headers: etag ? { etag } : {} },
    );
  }
}
