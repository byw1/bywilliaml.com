/**
 * Every detail of the party, in one place.
 *
 * The 3-D invite card, the page copy, the countdown and the page metadata all
 * read from here, so changing the date or the venue is a one-file edit.
 */
export const EVENT = {
  host: "William",
  /** The actual birthday. The party is the Saturday before it. */
  birthday: "December 20",
  /** ISO instant the party starts, with the offset written out. */
  startsAt: "2026-12-19T19:00:00-08:00",
  dayLabel: "Saturday",
  dateLabel: "December 19",
  /** Short form for the card face, which has room for about this much. */
  shortDateLabel: "SAT · DEC 19",
  yearLabel: "2026",
  timeLabel: "7:00 PM",
  timeZoneLabel: "PT",
  placeLabel: "Los Angeles",
  /** Deliberately vague in public: the address goes out with the RSVP reply. */
  placeDetail: "The address goes out to everyone who RSVPs.",
  dressCode: "Wear something you'd want photographed.",
  rsvpBy: "December 12",
} as const;

/** The party start as a real instant, for the countdown and for sorting. */
export const EVENT_START = new Date(EVENT.startsAt);
