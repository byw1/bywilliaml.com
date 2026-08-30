"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Slot {
  start: string;
  end: string;
}

interface Props {
  slug: string;
  title: string;
  description: string | null;
  durationMinutes: number;
  hostTimeZone: string;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** ISO date (YYYY-MM-DD) for an instant, as seen in `timeZone`. */
function isoDateIn(instant: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD, which saves reassembling parts by hand.
  return instant.toLocaleDateString("en-CA", { timeZone });
}

export function BookingFlow({
  slug,
  title,
  description,
  durationMinutes,
  hostTimeZone,
}: Props) {
  const browserZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone || hostTimeZone,
    [hostTimeZone],
  );

  const [viewerZone, setViewerZone] = useState(browserZone);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Guards against an earlier month's response landing after a later one and
  // overwriting it.
  const requestRef = useRef(0);

  useEffect(() => {
    const id = ++requestRef.current;
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const last = new Date(Date.UTC(cursor.year, cursor.month + 1, 0));

    setLoading(true);
    setLoadError(null);

    fetch(
      `/api/availability/${slug}?from=${first.toISOString().slice(0, 10)}` +
        `&to=${last.toISOString().slice(0, 10)}`,
    )
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "Couldn't load times");
        return data;
      })
      .then((data: { slots: Slot[] }) => {
        if (id !== requestRef.current) return;
        setSlots(data.slots);
        setLoading(false);
      })
      .catch((error: Error) => {
        if (id !== requestRef.current) return;
        setLoadError(error.message);
        setLoading(false);
      });
  }, [slug, cursor]);

  const slotsByDate = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const slot of slots) {
      const key = isoDateIn(new Date(slot.start), viewerZone);
      const list = map.get(key) ?? [];
      list.push(slot);
      map.set(key, list);
    }
    return map;
  }, [slots, viewerZone]);

  // Calendar grid, Monday-first, padded to whole weeks.
  const days = useMemo(() => {
    const first = new Date(Date.UTC(cursor.year, cursor.month, 1));
    const daysInMonth = new Date(
      Date.UTC(cursor.year, cursor.month + 1, 0),
    ).getUTCDate();
    const leading = (first.getUTCDay() + 6) % 7;

    const cells: Array<{ date: string; day: number } | null> = Array.from(
      { length: leading },
      () => null,
    );
    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(Date.UTC(cursor.year, cursor.month, day));
      cells.push({ date: date.toISOString().slice(0, 10), day });
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const selectedSlots = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];

  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: "numeric",
        minute: "2-digit",
        timeZone: viewerZone,
      }),
    [viewerZone],
  );

  const submit = useCallback(async () => {
    if (!selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          start: selectedSlot.start,
          name,
          email,
          notes,
          timeZone: viewerZone,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Booking failed");
      window.location.href = `/meet/booked/${data.id}?token=${encodeURIComponent(data.cancelToken)}`;
    } catch (error) {
      setSubmitError((error as Error).message);
      setSubmitting(false);
    }
  }, [selectedSlot, slug, name, email, notes, viewerZone]);

  const canSubmit =
    Boolean(selectedSlot) && name.trim().length > 0 && /.+@.+\..+/.test(email);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/10 md:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <aside className="bg-black p-7">
        <p className="text-xs uppercase tracking-[0.2em] text-white/40">
          William L
        </p>
        <h1 className="mt-3 text-2xl font-medium">{title}</h1>
        <p className="mt-4 flex items-center gap-2 text-sm text-white/60">
          <span aria-hidden>🕐</span> {durationMinutes} minutes
        </p>
        <p className="mt-2 flex items-center gap-2 text-sm text-white/60">
          <span aria-hidden>📹</span> Google Meet
        </p>
        {description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-white/70">
            {description}
          </p>
        ) : null}

        {selectedSlot ? (
          <div className="mt-7 rounded-xl border border-white/15 p-4">
            <p className="text-xs uppercase tracking-widest text-white/40">
              Selected
            </p>
            <p className="mt-2 text-sm">
              {new Date(selectedSlot.start).toLocaleString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "numeric",
                minute: "2-digit",
                timeZone: viewerZone,
              })}
            </p>
          </div>
        ) : null}
      </aside>

      <section className="bg-black p-7">
        {!selectedSlot ? (
          <>
            <header className="flex items-center justify-between">
              <h2 className="text-lg font-medium">
                {monthLabel(cursor.year, cursor.month)}
              </h2>
              <div className="flex gap-1">
                <button
                  type="button"
                  aria-label="Previous month"
                  onClick={() =>
                    setCursor((current) =>
                      current.month === 0
                        ? { year: current.year - 1, month: 11 }
                        : { ...current, month: current.month - 1 },
                    )
                  }
                  className="h-9 w-9 rounded-lg border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="Next month"
                  onClick={() =>
                    setCursor((current) =>
                      current.month === 11
                        ? { year: current.year + 1, month: 0 }
                        : { ...current, month: current.month + 1 },
                    )
                  }
                  className="h-9 w-9 rounded-lg border border-white/15 text-white/70 transition hover:border-white/40 hover:text-white"
                >
                  ›
                </button>
              </div>
            </header>

            <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-wider text-white/35">
              {WEEKDAY_LABELS.map((label) => (
                <span key={label}>{label}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1">
              {days.map((cell, index) => {
                if (!cell) return <span key={`pad-${index}`} />;
                const count = slotsByDate.get(cell.date)?.length ?? 0;
                const isSelected = selectedDate === cell.date;

                return (
                  <button
                    key={cell.date}
                    type="button"
                    disabled={count === 0}
                    onClick={() => setSelectedDate(cell.date)}
                    className={cn(
                      "aspect-square rounded-lg text-sm transition",
                      count === 0
                        ? "cursor-default text-white/20"
                        : "border border-white/20 text-white hover:border-white/60",
                      isSelected && "bg-white text-black hover:border-white",
                    )}
                  >
                    {cell.day}
                  </button>
                );
              })}
            </div>

            {loading ? (
              <p className="mt-6 text-sm text-white/50">Checking calendars…</p>
            ) : null}
            {loadError ? (
              <p className="mt-6 text-sm text-red-400">{loadError}</p>
            ) : null}

            {selectedDate && !loading ? (
              <div className="mt-6">
                <p className="text-xs uppercase tracking-widest text-white/40">
                  {new Date(`${selectedDate}T12:00:00Z`).toLocaleDateString(
                    undefined,
                    { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" },
                  )}
                </p>
                <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                  {selectedSlots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => setSelectedSlot(slot)}
                      className="rounded-lg border border-white/20 py-2.5 text-sm transition hover:border-white hover:bg-white hover:text-black"
                    >
                      {timeFormatter.format(new Date(slot.start))}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <label className="mt-7 block text-xs uppercase tracking-widest text-white/40">
              Time zone
              <select
                value={viewerZone}
                onChange={(event) => setViewerZone(event.target.value)}
                className="mt-2 w-full rounded-lg border border-white/20 bg-black px-3 py-2 text-sm normal-case tracking-normal text-white"
              >
                {[...new Set([browserZone, hostTimeZone, "UTC"])].map((zone) => (
                  <option key={zone} value={zone}>
                    {zone.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void submit();
            }}
            className="space-y-4"
          >
            <button
              type="button"
              onClick={() => setSelectedSlot(null)}
              className="text-sm text-white/50 transition hover:text-white"
            >
              ← Pick a different time
            </button>

            <div>
              <label htmlFor="booking-name" className="text-sm text-white/60">
                Name
              </label>
              <input
                id="booking-name"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 text-sm outline-none transition focus:border-white"
              />
            </div>

            <div>
              <label htmlFor="booking-email" className="text-sm text-white/60">
                Email
              </label>
              <input
                id="booking-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-black px-3 py-2.5 text-sm outline-none transition focus:border-white"
              />
              <p className="mt-1.5 text-xs text-white/40">
                The calendar invite and Meet link go here.
              </p>
            </div>

            <div>
              <label htmlFor="booking-notes" className="text-sm text-white/60">
                What&apos;s this about?{" "}
                <span className="text-white/35">(optional)</span>
              </label>
              <textarea
                id="booking-notes"
                rows={4}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="mt-1 w-full resize-none rounded-lg border border-white/20 bg-black px-3 py-2.5 text-sm outline-none transition focus:border-white"
              />
            </div>

            {submitError ? (
              <p className="text-sm text-red-400">{submitError}</p>
            ) : null}

            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full rounded-lg bg-white py-3 text-sm font-medium text-black transition hover:bg-white/85 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? "Booking…" : "Confirm booking"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
