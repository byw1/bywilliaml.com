import { NextResponse, type NextRequest } from "next/server";
import { decodeIdToken, exchangeGoogleCode } from "@/lib/providers/google";
import { redirectUris } from "@/lib/oauth-urls";
import { consumeState, requireAdmin } from "@/lib/session";
import { saveConnection } from "@/lib/connect";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const code = request.nextUrl.searchParams.get("code");
  const intent = await consumeState(request.nextUrl.searchParams.get("state"));
  if (!code || intent !== "google") {
    return NextResponse.redirect(`${env.appUrl}/admin?error=bad_state`);
  }

  try {
    const token = await exchangeGoogleCode(code, redirectUris.connectGoogle());
    if (!token.refresh_token) {
      // Google withholds it when the app already has a live grant; revoking
      // access in the Google account settings and retrying fixes it.
      return NextResponse.redirect(`${env.appUrl}/admin?error=no_refresh_token`);
    }
    const profile = token.id_token ? decodeIdToken(token.id_token) : {};
    if (!profile.email) {
      return NextResponse.redirect(`${env.appUrl}/admin?error=no_email`);
    }

    await saveConnection({
      provider: "google",
      accountEmail: profile.email,
      displayName: profile.name,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresInSeconds: token.expires_in,
      scopes: token.scope,
    });
    return NextResponse.redirect(`${env.appUrl}/admin?connected=google`);
  } catch (error) {
    return NextResponse.redirect(
      `${env.appUrl}/admin?error=${encodeURIComponent((error as Error).message.slice(0, 200))}`,
    );
  }
}
