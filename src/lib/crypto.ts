import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { env } from "./env";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12; // GCM's standard nonce length.

function keyBytes(): Buffer {
  const key = Buffer.from(env.encryptionKey, "base64");
  if (key.length !== 32) {
    throw new Error(
      "SCHEDULING_ENCRYPTION_KEY must be 32 bytes of base64 (generate with: openssl rand -base64 32)",
    );
  }
  return key;
}

/**
 * Encrypts a secret for storage. Output is `iv.ciphertext.tag`, all base64url,
 * so it round-trips through a text column untouched.
 */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, keyBytes(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [iv, ciphertext, tag]
    .map((part) => part.toString("base64url"))
    .join(".");
}

export function decryptSecret(payload: string): string {
  const parts = payload.split(".");
  if (parts.length !== 3) {
    throw new Error("Malformed encrypted value");
  }
  const [iv, ciphertext, tag] = parts.map((part) =>
    Buffer.from(part, "base64url"),
  );
  const decipher = createDecipheriv(ALGORITHM, keyBytes(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]).toString("utf8");
}

/** Appends an HMAC so a cookie value can be trusted when it comes back. */
export function sign(value: string): string {
  const mac = createHmac("sha256", env.sessionSecret)
    .update(value)
    .digest("base64url");
  return `${value}.${mac}`;
}

/** Returns the payload if the signature is intact, otherwise null. */
export function unsign(signed: string): string | null {
  const index = signed.lastIndexOf(".");
  if (index <= 0) return null;

  const value = signed.slice(0, index);
  const provided = Buffer.from(signed.slice(index + 1), "base64url");
  const expected = createHmac("sha256", env.sessionSecret)
    .update(value)
    .digest();

  // Compare in constant time, and only when the lengths already match —
  // timingSafeEqual throws on a length mismatch.
  if (provided.length !== expected.length) return null;
  return timingSafeEqual(provided, expected) ? value : null;
}

/** URL-safe random identifier, used for booking ids and cancel tokens. */
export function randomToken(bytes = 18): string {
  return randomBytes(bytes).toString("base64url");
}
