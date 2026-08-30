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

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const CALENDAR_API = "https://www.googleapis.com/calendar/v3";
const MEET_API = "https://meet.googleapis.com/v2";

/**
 * Scopes requested when connecting a calendar account.
 *
 * `meetings.space.created` is what lets us mint a standalone Meet link that
 * isn't attached to a Google Calendar event — the only way to put a real Meet
 * URL on a Zoho-hosted booking.
 */
export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/meetings.space.created",
  "openid",
  "email",
  "profile",
];

/** Scopes for signing in to /admin. Identity only — no calendar access. */
export const GOOGLE_LOGIN_SCOPES = ["openid", "email", "profile"];

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
}

export async function exchangeGoogleCode(
  code: string,
  redirectUri: string,
): Promise<GoogleTokenResponse> {
  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  if (!response.ok) {
    throw new Error(`Google token exchange failed: ${await response.text()}`);
  }
  return response.json();
}

/** Reads the email/name out of an id_token without a signature check. */
export function decodeIdToken(idToken: string): {
  email?: string;
  name?: string;
  email_verified?: boolean;
} {
  const payload = idToken.split(".")[1];
  if (!payload) return {};
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
}

/**
 * Returns a usable access token for the connection, refreshing and persisting
 * it when the stored one is within a minute of expiry.
 */
async function accessTokenFor(row: ConnectionRow): Promise<string> {
  const expiresAt = row.expires_at ? row.expires_at.getTime() : 0;
  if (row.access_token && expiresAt > Date.now() + 60_000) {
    return decryptSecret(row.access_token);
  }

  const response = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: env.googleClientId,
      client_secret: env.googleClientSecret,
      refresh_token: decryptSecret(row.refresh_token),
      grant_type: "refresh_token",
    }),
  });
  if (!response.ok) {
    throw new Error(
      `Google refresh failed for ${row.account_email}: ${await response.text()}. Reconnect the account in /admin.`,
    );
  }

  const token: GoogleTokenResponse = await response.json();
  const expiry = new Date(Date.now() + token.expires_in * 1000);
  await query(
    "UPDATE connections SET access_token = $1, expires_at = $2, updated_at = now() WHERE id = $3",
    [encryptSecret(token.access_token), expiry, row.id],
  );
  // Keep the in-memory row in step so a second call in the same request
  // doesn't refresh again.
  row.access_token = encryptSecret(token.access_token);
  row.expires_at = expiry;
  return token.access_token;
}

export class GoogleCalendarProvider implements CalendarProvider {
  readonly provider = "google" as const;

  constructor(private readonly row: ConnectionRow) {}

  private async request<T>(
    url: string,
    init: RequestInit = {},
  ): Promise<T> {
    const token = await accessTokenFor(this.row);
    const response = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(
        `Google API ${init.method ?? "GET"} ${url} → ${response.status}: ${await response.text()}`,
      );
    }
    return response.status === 204
      ? (undefined as T)
      : ((await response.json()) as T);
  }

  async listCalendars(): Promise<RemoteCalendar[]> {
    const data = await this.request<{
      items?: Array<{
        id: string;
        summary: string;
        timeZone?: string;
        primary?: boolean;
        accessRole: string;
      }>;
    }>(`${CALENDAR_API}/users/me/calendarList?minAccessRole=reader`);

    return (data.items ?? []).map((item) => ({
      remoteId: item.id,
      summary: item.summary,
      timeZone: item.timeZone,
      isPrimary: Boolean(item.primary),
    }));
  }

  async getBusy(
    calendarIds: string[],
    from: Date,
    to: Date,
  ): Promise<BusyInterval[]> {
    if (calendarIds.length === 0) return [];

    const data = await this.request<{
      calendars?: Record<
        string,
        { busy?: Array<{ start: string; end: string }>; errors?: unknown[] }
      >;
    }>(`${CALENDAR_API}/freeBusy`, {
      method: "POST",
      body: JSON.stringify({
        timeMin: from.toISOString(),
        timeMax: to.toISOString(),
        items: calendarIds.map((id) => ({ id })),
      }),
    });

    const intervals: BusyInterval[] = [];
    for (const entry of Object.values(data.calendars ?? {})) {
      for (const window of entry.busy ?? []) {
        intervals.push({
          start: new Date(window.start),
          end: new Date(window.end),
        });
      }
    }
    return intervals;
  }

  /**
   * Creates a Meet space that isn't tied to any calendar event, so a booking
   * hosted on a non-Google calendar can still hand out a real Meet link.
   */
  async createMeetSpace(): Promise<string> {
    const space = await this.request<{ meetingUri?: string }>(
      `${MEET_API}/spaces`,
      { method: "POST", body: "{}" },
    );
    if (!space.meetingUri) {
      throw new Error("Google Meet API returned a space with no meetingUri");
    }
    return space.meetingUri;
  }

  async createEvent(input: CreateEventInput): Promise<CreatedEvent> {
    // Without a pre-minted link, ask Calendar to attach a fresh Meet
    // conference as part of creating the event.
    const conference = input.meetingUrl
      ? {
          conferenceData: {
            conferenceSolution: { key: { type: "addOn" } },
            entryPoints: [
              { entryPointType: "video", uri: input.meetingUrl },
            ],
          },
        }
      : {
          conferenceData: {
            createRequest: {
              requestId: `bk-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
              conferenceSolutionKey: { type: "hangoutsMeet" },
            },
          },
        };

    const event = await this.request<{
      id: string;
      hangoutLink?: string;
      conferenceData?: { entryPoints?: Array<{ uri?: string }> };
    }>(
      `${CALENDAR_API}/calendars/${encodeURIComponent(input.calendarId)}/events` +
        `?conferenceDataVersion=1&sendUpdates=all`,
      {
        method: "POST",
        body: JSON.stringify({
          summary: input.title,
          description: input.description,
          start: { dateTime: input.start.toISOString(), timeZone: input.timeZone },
          end: { dateTime: input.end.toISOString(), timeZone: input.timeZone },
          attendees: [
            { email: input.attendee.email, displayName: input.attendee.name },
          ],
          guestsCanInviteOthers: false,
          guestsCanModify: false,
          ...conference,
        }),
      },
    );

    return {
      remoteEventId: event.id,
      meetingUrl:
        event.hangoutLink ??
        event.conferenceData?.entryPoints?.find((point) => point.uri)?.uri ??
        input.meetingUrl,
    };
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<void> {
    await this.request(
      `${CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=all`,
      { method: "DELETE" },
    );
  }
}
