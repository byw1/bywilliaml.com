"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { databaseConfigured } from "@/lib/env";
import { saveRsvp } from "@/lib/birthday/rsvps";
import type { RsvpState } from "@/lib/birthday/rsvp-state";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LIMITS = { name: 80, phone: 32, email: 160, message: 500 } as const;

/**
 * Best-effort flood guard: the form is public and unauthenticated, so one
 * address can otherwise fill the wall. State is per-process, which is enough
 * to stop a script without a shared store standing between a guest and their
 * RSVP.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 5;
const globalForRate = globalThis as unknown as {
  birthdayRsvpHits?: Map<string, number[]>;
};

function withinRateLimit(key: string): boolean {
  const hits = (globalForRate.birthdayRsvpHits ??= new Map<string, number[]>());
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter(
    (at) => now - at < RATE_WINDOW_MS,
  );
  recent.push(now);
  hits.set(key, recent);

  // The map would otherwise grow for the life of the process.
  if (hits.size > 500) {
    for (const [entry, times] of hits) {
      if (times.every((at) => now - at >= RATE_WINDOW_MS)) hits.delete(entry);
    }
  }
  return recent.length <= RATE_MAX;
}

function field(data: FormData, name: string, limit: number): string {
  return String(data.get(name) ?? "")
    .trim()
    .slice(0, limit);
}

export async function submitRsvp(
  _previous: RsvpState,
  formData: FormData,
): Promise<RsvpState> {
  if (!databaseConfigured()) {
    return {
      status: "error",
      message: "RSVPs aren't switched on yet. Text me instead.",
    };
  }

  const name = field(formData, "name", LIMITS.name);
  const phone = field(formData, "phone", LIMITS.phone);
  const email = field(formData, "email", LIMITS.email);
  const message = field(formData, "message", LIMITS.message);
  const plusOne = formData.get("plusOne") === "yes";

  if (name.length < 2) {
    return { status: "error", message: "What should I call you?", field: "name" };
  }
  // Deliberately loose: people write numbers with spaces, dots, brackets and
  // country codes, and none of that is worth rejecting an invite over.
  if ((phone.match(/\d/g) ?? []).length < 7) {
    return {
      status: "error",
      message: "That phone number looks short.",
      field: "phone",
    };
  }
  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "That email address doesn't look right.",
      field: "email",
    };
  }

  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  if (!withinRateLimit(forwarded.split(",")[0]?.trim() || "unknown")) {
    return {
      status: "error",
      message: "That's a lot of RSVPs. Give it a minute.",
    };
  }

  try {
    const { created } = await saveRsvp({
      name,
      phone,
      email,
      message: message || null,
      plusOne,
    });
    // The page is dynamic, not cached, so the guest wall just needs the client
    // router to pull a fresh render rather than a tag revalidation.
    refresh();
    return {
      status: "ok",
      message: created
        ? "You're on the list."
        : "Updated — same spot on the list.",
    };
  } catch (error) {
    console.error("Birthday RSVP failed", error);
    return {
      status: "error",
      message: "Something broke on my end. Try again in a moment?",
    };
  }
}
