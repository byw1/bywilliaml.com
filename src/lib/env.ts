/**
 * Environment access. Every getter throws on first use if the variable is
 * missing, rather than at import time — the marketing pages still prerender on
 * a machine with no secrets configured, and only the scheduling routes need
 * these to exist.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required environment variable ${name}. See DEPLOY.md — the scheduling routes cannot run without it.`,
    );
  }
  return value;
}

export const env = {
  get databaseUrl() {
    return required("DATABASE_URL");
  },
  /** 32 bytes, base64. Encrypts OAuth refresh tokens at rest. */
  get encryptionKey() {
    return required("SCHEDULING_ENCRYPTION_KEY");
  },
  /** Signs the admin session and OAuth `state` cookies. */
  get sessionSecret() {
    return required("SCHEDULING_SESSION_SECRET");
  },
  get googleClientId() {
    return required("GOOGLE_CLIENT_ID");
  },
  get googleClientSecret() {
    return required("GOOGLE_CLIENT_SECRET");
  },
  get zohoClientId() {
    return required("ZOHO_CLIENT_ID");
  },
  get zohoClientSecret() {
    return required("ZOHO_CLIENT_SECRET");
  },
  /**
   * Zoho's OAuth host for the datacentre the account lives in. Accounts are
   * pinned to a region and the wrong host returns "invalid_client".
   */
  get zohoAccountsHost() {
    return process.env.ZOHO_ACCOUNTS_HOST ?? "https://accounts.zoho.com";
  },
  /** Absolute origin, used to build OAuth redirect URIs. */
  get appUrl() {
    return (process.env.APP_URL ?? "https://bywilliaml.com").replace(/\/$/, "");
  },
  /** Comma-separated allowlist of Google accounts that may open /admin. */
  get adminEmails() {
    return required("ADMIN_EMAILS")
      .split(",")
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean);
  },
};

/** True when the scheduling feature has enough configuration to run at all. */
export function schedulingConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.SCHEDULING_ENCRYPTION_KEY &&
      process.env.SCHEDULING_SESSION_SECRET,
  );
}
