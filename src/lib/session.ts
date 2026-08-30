import { cookies } from "next/headers";
import { sign, unsign } from "./crypto";
import { env } from "./env";

const SESSION_COOKIE = "bwl_admin";
const STATE_COOKIE = "bwl_oauth_state";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14; // two weeks

export interface AdminSession {
  email: string;
  expiresAt: number;
}

function isAllowed(email: string): boolean {
  return env.adminEmails.includes(email.toLowerCase());
}

export async function createSession(email: string): Promise<void> {
  if (!isAllowed(email)) {
    throw new Error(`${email} is not on the admin allowlist.`);
  }
  const payload = `${email}|${Date.now() + SESSION_TTL_MS}`;
  const store = await cookies();
  store.set(SESSION_COOKIE, sign(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function readSession(): Promise<AdminSession | null> {
  const raw = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const payload = unsign(raw);
  if (!payload) return null;

  const [email, expiry] = payload.split("|");
  const expiresAt = Number(expiry);
  if (!email || !Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return null;
  }
  // Re-check the allowlist on every read: removing an address from
  // ADMIN_EMAILS should log that person out immediately, not in two weeks.
  if (!isAllowed(email)) return null;

  return { email, expiresAt };
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}

/** Throws unless the caller holds a valid admin session. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await readSession();
  if (!session) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return session;
}

/**
 * OAuth CSRF state, stored in a signed short-lived cookie rather than a
 * database table — it only needs to survive one redirect.
 */
export async function issueState(intent: string): Promise<string> {
  const nonce = `${intent}:${Math.random().toString(36).slice(2)}${Date.now()}`;
  const store = await cookies();
  store.set(STATE_COOKIE, sign(nonce), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return nonce;
}

export async function consumeState(provided: string | null): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(STATE_COOKIE)?.value;
  store.delete(STATE_COOKIE);
  if (!raw || !provided) return null;

  const expected = unsign(raw);
  if (!expected || expected !== provided) return null;
  return expected.split(":")[0];
}
