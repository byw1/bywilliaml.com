import { redirect } from "next/navigation";
import { GOOGLE_CALENDAR_SCOPES } from "@/lib/providers";
import { googleAuthorizeUrl, redirectUris } from "@/lib/oauth-urls";
import { issueState, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const state = await issueState("google");
  redirect(
    googleAuthorizeUrl({
      state,
      redirectUri: redirectUris.connectGoogle(),
      scopes: GOOGLE_CALENDAR_SCOPES,
      offline: true,
    }),
  );
}
