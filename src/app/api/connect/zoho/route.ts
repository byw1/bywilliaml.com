import { redirect } from "next/navigation";
import { zohoAuthorizeUrl } from "@/lib/providers/zoho";
import { redirectUris } from "@/lib/oauth-urls";
import { issueState, requireAdmin } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const state = await issueState("zoho");
  redirect(zohoAuthorizeUrl(state, redirectUris.connectZoho()));
}
