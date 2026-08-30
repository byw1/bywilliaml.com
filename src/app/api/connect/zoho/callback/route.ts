import { NextResponse, type NextRequest } from "next/server";
import { exchangeZohoCode, fetchZohoProfile } from "@/lib/providers/zoho";
import { redirectUris } from "@/lib/oauth-urls";
import { consumeState, requireAdmin } from "@/lib/session";
import { saveConnection } from "@/lib/connect";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  await requireAdmin();

  const code = request.nextUrl.searchParams.get("code");
  const intent = await consumeState(request.nextUrl.searchParams.get("state"));
  if (!code || intent !== "zoho") {
    return NextResponse.redirect(`${env.appUrl}/admin?error=bad_state`);
  }

  try {
    const token = await exchangeZohoCode(code, redirectUris.connectZoho());
    if (!token.refresh_token) {
      return NextResponse.redirect(`${env.appUrl}/admin?error=no_refresh_token`);
    }
    const profile = await fetchZohoProfile(token.access_token);
    if (!profile.email) {
      return NextResponse.redirect(`${env.appUrl}/admin?error=no_email`);
    }

    await saveConnection({
      provider: "zoho",
      accountEmail: profile.email,
      displayName: profile.name,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresInSeconds: token.expires_in,
      scopes: token.scope,
      apiDomain: token.api_domain,
    });
    return NextResponse.redirect(`${env.appUrl}/admin?connected=zoho`);
  } catch (error) {
    return NextResponse.redirect(
      `${env.appUrl}/admin?error=${encodeURIComponent((error as Error).message.slice(0, 200))}`,
    );
  }
}
