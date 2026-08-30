/** Weekly recurring availability: ISO weekday (1 = Monday) → "HH:mm" windows. */
export type WeeklyAvailability = Record<string, Array<[string, string]>>;

export interface BookingType {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  duration_minutes: number;
  host_connection_id: string | null;
  host_calendar_remote_id: string | null;
  time_zone: string;
  availability: WeeklyAvailability;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  min_notice_minutes: number;
  max_days_ahead: number;
  slot_increment_minutes: number;
  max_per_day: number | null;
  is_active: boolean;
}

export interface Booking {
  id: string;
  booking_type_id: string;
  starts_at: Date;
  ends_at: Date;
  invitee_name: string;
  invitee_email: string;
  invitee_notes: string | null;
  invitee_time_zone: string | null;
  status: "confirmed" | "cancelled";
  meeting_url: string | null;
  remote_event_id: string | null;
  remote_calendar_id: string | null;
  cancel_token: string;
  created_at: Date;
}

/** A bookable start time, as an absolute instant. */
export interface Slot {
  start: string;
  end: string;
}
