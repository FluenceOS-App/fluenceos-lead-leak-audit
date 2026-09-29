import { NextResponse } from "next/server";
import { buildPrimaryResultContent } from "@/lib/audit/results";
import { scoreAudit } from "@/lib/audit/scoring";
import { detectDeviceType, parseAuditSubmission } from "@/lib/audit/submission";
import { getServerSupabase } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

export const runtime = "nodejs";

function toJson(value: unknown): Json {
  return JSON.parse(JSON.stringify(value)) as Json;
}

function publicResult(result: ReturnType<typeof scoreAudit>) {
  return {
    primaryCategory: result.primaryCategory,
    primaryType: result.primaryType,
    secondaryCategory: result.secondaryCategory,
    secondaryType: result.secondaryType,
    contributingFriction: result.contributingFriction,
    downstreamRisk: result.downstreamRisk,
    collapsedDownstream: result.collapsedDownstream,
    watchAreas: result.watchAreas,
    confidenceState: result.confidenceState,
    mixedPattern: result.mixedPattern,
  };
}

export async function POST(request: Request) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const submission = parseAuditSubmission(payload);
  if (!submission) {
    return NextResponse.json(
      { error: "All eight Audit answers are required and must use values 1-4." },
      { status: 400 },
    );
  }

  const auditSessionId = submission.auditSessionId ?? crypto.randomUUID();
  const result = scoreAudit(submission.answers);
  const content = buildPrimaryResultContent(submission.answers, result);
  const deviceType = detectDeviceType(request.headers.get("user-agent"));

  const row = {
    audit_session_id: auditSessionId,
    completed_at: new Date().toISOString(),
    utm_source: submission.attribution.utmSource ?? null,
    utm_medium: submission.attribution.utmMedium ?? null,
    utm_campaign: submission.attribution.utmCampaign ?? null,
    utm_content: submission.attribution.utmContent ?? null,
    utm_term: submission.attribution.utmTerm ?? null,
    referrer: submission.attribution.referrer ?? null,
    device_type: deviceType,
    answers_json: toJson(submission.answers),
    primary_leak_category: result.primaryCategory,
    primary_type: result.primaryType,
    secondary_leak_category: result.secondaryCategory ?? null,
    secondary_type: result.secondaryType ?? null,
    confidence_state: result.confidenceState,
    mixed_pattern: result.mixedPattern,
    result_variant: content.variant,
    score_breakdown_json: toJson(result.categories),
    result_meta_json: toJson({
      collapsedDownstream: result.collapsedDownstream,
      watchAreas: result.watchAreas,
      contributingFriction: result.contributingFriction ?? null,
      downstreamRisk: result.downstreamRisk ?? null,
    }),
    reason_codes_json: toJson(result.reasonCodes),
    completion_seconds: submission.completionSeconds ?? null,
  };

  try {
    const supabase = getServerSupabase();
    const { data, error } = await supabase
      .from("lead_leak_audit_responses")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("Lead Leak Audit response insert failed", {
        code: error.code,
        message: error.message,
      });
      return NextResponse.json(
        { error: "We could not save the Audit result. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        responseId: data.id,
        auditSessionId,
        result: publicResult(result),
        content,
      },
      {
        status: 201,
        headers: { "Cache-Control": "no-store" },
      },
    );
  } catch (error) {
    console.error("Lead Leak Audit server configuration failed", error);
    return NextResponse.json(
      { error: "The Audit service is temporarily unavailable." },
      { status: 500 },
    );
  }
}
