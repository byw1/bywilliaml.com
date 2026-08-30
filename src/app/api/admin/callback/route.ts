import { NextResponse, type NextRequest } from "next/server";
import { decodeIdToken, exchangeGoogleCode } from "@/lib/providers/google";
import { redirectUris } from "@/lib/oauth-urls";
import { consumeState, createSession } from "@/lib/session";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const intent = await consumeState(request.nextUrl.searchParams.get("state"));

  if (!code || intent !== "admin") {
    return NextResponse.redirect(`${env.appUrl}/admin?error=bad_state`);
  }

  try {
    const token = await exchangeGoogleCode(code, redirectUris.adminLogin());
    const profile = token.id_token ? decodeIdToken(token.id_token) : {};
    if (!profile.email || profile.email_verified === false) {
      return NextResponse.redirect(`${env.appUrl}/admin?error=no_email`);
    }
    await createSession(profile.email);
    return NextResponse.redirect(`${env.appUrl}/admin`);
  } catch {
    // The most common cause by far is an address that isn't on the allowlist.
    return NextResponse.redirect(`${env.appUrl}/admin?error=not_allowed`);
  }
}
