import test from "node:test";
import assert from "node:assert/strict";
import { parseCtaClickPayload } from "../lib/audit/tracking";

const valid = {
  responseId: "550e8400-e29b-41d4-a716-446655440000",
  auditSessionId: "6ba7b810-9dad-41d1-80b4-00c04fd430c8",
  ctaTarget: "https://app.fluenceos.io",
  ctaVariant: "followup_proposal",
};

test("valid CTA click payload is accepted and trimmed", () => {
  const parsed = parseCtaClickPayload({
    ...valid,
    ctaTarget: " https://app.fluenceos.io ",
    ctaVariant: " followup_proposal ",
  });

  assert.ok(parsed);
  assert.equal(parsed.ctaTarget, "https://app.fluenceos.io");
  assert.equal(parsed.ctaVariant, "followup_proposal");
});

test("CTA click payload requires matching UUID-shaped identifiers", () => {
  assert.equal(parseCtaClickPayload({ ...valid, responseId: "nope" }), null);
  assert.equal(parseCtaClickPayload({ ...valid, auditSessionId: "nope" }), null);
});

test("CTA target must be an http(s) URL", () => {
  assert.equal(parseCtaClickPayload({ ...valid, ctaTarget: "javascript:alert(1)" }), null);
  assert.equal(parseCtaClickPayload({ ...valid, ctaTarget: "/relative" }), null);
});
