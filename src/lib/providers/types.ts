/** A window of time the host is already committed. */
export interface BusyInterval {
  start: Date;
  end: Date;
}

/** A calendar a booking can be written to, or checked against. */
export interface RemoteCalendar {
  remoteId: string;
  summary: string;
  timeZone?: string;
  isPrimary: boolean;
}

export interface CreateEventInput {
  calendarId: string;
  title: string;
  description: string;
  start: Date;
  end: Date;
  /** IANA zone the event is displayed in. */
  timeZone: string;
  attendee: { name: string; email: string };
  /**
   * A Google Meet URL minted ahead of time. Google can generate its own during
   * event creation, so it leaves this unset; Zoho has no way to mint one and
   * always receives a link created via a connected Google account.
   */
  meetingUrl?: string;
}

export interface CreatedEvent {
  remoteEventId: string;
  /** Whatever conferencing link ended up on the event. */
  meetingUrl?: string;
}

/**
 * The surface every calendar backend has to implement. Adding Outlook later
 * means writing one more of these and nothing else.
 */
export interface CalendarProvider {
  readonly provider: "google" | "zoho";
  listCalendars(): Promise<RemoteCalendar[]>;
  /**
   * Busy windows between `from` and `to`. Implementations may ignore
   * `calendarIds` if the upstream API only reports per-account availability —
   * Zoho does exactly that.
   */
  getBusy(calendarIds: string[], from: Date, to: Date): Promise<BusyInterval[]>;
  createEvent(input: CreateEventInput): Promise<CreatedEvent>;
  deleteEvent(calendarId: string, eventId: string): Promise<void>;
}

/** Row shape shared by the provider factories. */
export interface ConnectionRow {
  id: string;
  provider: "google" | "zoho";
  account_email: string;
  display_name: string | null;
  access_token: string | null;
  refresh_token: string;
  expires_at: Date | null;
  scopes: string | null;
  api_domain: string | null;
}
