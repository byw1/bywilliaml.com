import { env } from "./env";

/**
 * Redirect URIs must match what's registered in the Google Cloud console and
 * the Zoho API console byte for byte, so they're derived in one place.
 */
export const redirectUris = {
  adminLogin: () => `${env.appUrl}/api/admin/callback`,
  connectGoogle: () => `${env.appUrl}/api/connect/google/callback`,
  connectZoho: () => `${env.appUrl}/api/connect/zoho/callback`,
};

export function googleAuthorizeUrl(options: {
  state: string;
  redirectUri: string;
  scopes: string[];
  /** Offline access is what yields a refresh token. */
  offline?: boolean;
  loginHint?: string;
}): string {
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: options.redirectUri,
    response_type: "code",
    scope: options.scopes.join(" "),
    state: options.state,
    include_granted_scopes: "true",
  });
  if (options.offline) {
    params.set("access_type", "offline");
    // Without this Google withholds the refresh token on every grant after
    // the first, and the connection silently expires an hour later.
    params.set("prompt", "consent");
  }
  if (options.loginHint) params.set("login_hint", options.loginHint);

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}
