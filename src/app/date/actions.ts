"use server";

import { headers } from "next/headers";
import { recordDateRequest } from "@/lib/date/requests";

export interface DateAnswer {
  name: string;
  phone: string;
  day: string;
  time: string;
  food: string;
  activity: string;
  noClicks: number;
  /** Honeypot. People never see it; form-filling bots do. */
  website?: string;
}

export type DateResult = { ok: true } | { ok: false; message: string };

const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 4;
const globalForRate = globalThis as unknown as { dateHits?: Map<string, number[]> };

function withinRateLimit(key: string): boolean {
  const hits = (globalForRate.dateHits ??= new Map<string, number[]>());
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) {
    for (const [entry, times] of hits) {
      if (times.every((at) => now - at >= RATE_WINDOW_MS)) hits.delete(entry);
    }
  }
  return recent.length <= RATE_MAX;
}

const clip = (value: unknown, limit: number) => String(value ?? "").trim().slice(0, limit);

export async function submitDate(answer: DateAnswer): Promise<DateResult> {
  // Pretend it worked; there's nothing to tell a bot.
  if (answer.website) return { ok: true };

  const name = clip(answer.name, 80);
  const phone = clip(answer.phone, 32);
  if (name.length < 1) return { ok: false, message: "i need a name for the paperwork." };
  if ((phone.match(/\d/g) ?? []).length < 7) {
    return { ok: false, message: "that number's a little short." };
  }

  const forwarded = (await headers()).get("x-forwarded-for") ?? "";
  if (!withinRateLimit(forwarded.split(",")[0]?.trim() || "unknown")) {
    return { ok: false, message: "easy. one date at a time." };
  }

  const saved = await recordDateRequest({
    name,
    phone,
    day: clip(answer.day, 60),
    time: clip(answer.time, 40),
    food: clip(answer.food, 40),
    activity: clip(answer.activity, 40),
    noClicks: Math.max(0, Math.min(999, Math.floor(Number(answer.noClicks) || 0))),
  });
  return saved
    ? { ok: true }
    : { ok: false, message: "it didn't go through on my end. screenshot this and text it to me." };
}
