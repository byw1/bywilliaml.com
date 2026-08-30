import { redirect } from "next/navigation";
import { GOOGLE_LOGIN_SCOPES } from "@/lib/providers";
import { googleAuthorizeUrl, redirectUris } from "@/lib/oauth-urls";
import { issueState } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await issueState("admin");
  redirect(
    googleAuthorizeUrl({
      state,
      redirectUri: redirectUris.adminLogin(),
      scopes: GOOGLE_LOGIN_SCOPES,
    }),
  );
}
