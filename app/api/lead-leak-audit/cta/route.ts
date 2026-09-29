import { NextResponse } from "next/server";
import { parseCtaClickPayload } from "@/lib/audit/tracking";
import { getServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const click = parseCtaClickPayload(payload);
  if (!click) {
    return NextResponse.json({ error: "Invalid CTA click payload." }, { status: 400 });
  }

  try {
    const supabase = getServerSupabase();
    const { error } = await supabase
      .from("lead_leak_audit_responses")
      .update({
        cta_clicked: true,
        cta_clicked_at: new Date().toISOString(),
        cta_target: click.ctaTarget,
        cta_variant: click.ctaVariant,
      })
      .eq("id", click.responseId)
      .eq("audit_session_id", click.auditSessionId)
      .eq("cta_clicked", false);

    if (error) {
      console.error("Lead Leak Audit CTA tracking failed", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json({ error: "CTA tracking failed." }, { status: 500 });
    }

    return new NextResponse(null, {
      status: 204,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Lead Leak Audit CTA tracking configuration failed", error);
    return NextResponse.json({ error: "CTA tracking unavailable." }, { status: 500 });
  }
}
