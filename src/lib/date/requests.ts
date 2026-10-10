import { databaseConfigured } from "@/lib/env";
import { ensureMigrated, query } from "@/lib/db";

export interface DateRequest {
  name: string;
  phone: string;
  day: string;
  time: string;
  food: string;
  activity: string;
  noClicks: number;
}

async function save(input: DateRequest): Promise<void> {
  await ensureMigrated();
  await query(
    `INSERT INTO date_requests (name, phone, day, time, food, activity, no_clicks)
          VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [input.name, input.phone, input.day, input.time, input.food, input.activity, input.noClicks],
  );
}

function escape(value: string): string {
  return value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Sends the answer through Resend's REST API. No SDK: one POST doesn't earn a
 * dependency.
 */
async function email(input: DateRequest): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("RESEND_API_KEY is not set");
  const to = process.env.DATE_NOTIFY_EMAIL ?? "william@bywilliaml.com";
  const from = process.env.DATE_EMAIL_FROM ?? "bywilliaml.com <date@hired.tools>";

  const rows: [string, string][] = [
    ["Name", input.name],
    ["Phone", input.phone],
    ["When", `${input.day} · ${input.time}`],
    ["Food", input.food],
    ["Activity", input.activity],
    ["Clicked no", `${input.noClicks} time${input.noClicks === 1 ? "" : "s"}`],
  ];
  const text = rows.map(([k, v]) => `${k}: ${v}`).join("\n");
  const html = `<div style="font-family:-apple-system,Segoe UI,sans-serif;font-size:15px;color:#1a1a1a">
<p style="font-size:18px;margin:0 0 12px"><b>${escape(input.name)}</b> said yes.</p>
<table cellpadding="6" style="border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><td style="color:#888;padding-right:16px">${k}</td><td>${escape(v)}</td></tr>`,
    )
    .join("")}</table>
<p style="color:#888;font-size:13px;margin-top:16px">from bywilliaml.com/date</p></div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `${input.name} said yes — ${input.day}, ${input.time}`,
      text,
      html,
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

/**
 * Stores and emails a date request. Succeeds if either lands, so one broken
 * channel never loses an answer.
 */
export async function recordDateRequest(input: DateRequest): Promise<boolean> {
  const jobs = [email(input)];
  if (databaseConfigured()) jobs.push(save(input));
  const results = await Promise.allSettled(jobs);
  for (const r of results) {
    if (r.status === "rejected") console.error("Date request delivery failed", r.reason);
  }
  // Railway's logs are the last resort if both channels are down.
  if (results.every((r) => r.status === "rejected")) {
    console.error("Unsaved date request", JSON.stringify(input));
    return false;
  }
  return true;
}
