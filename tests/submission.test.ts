import test from "node:test";
import assert from "node:assert/strict";
import { detectDeviceType, parseAuditSubmission } from "../lib/audit/submission";

const validAnswers = {
  q1: 1, q2: 2, q3: 3, q4: 4, q5: 1, q6: 2, q7: 3, q8: 4,
};

test("valid audit submission is parsed and attribution is trimmed", () => {
  const parsed = parseAuditSubmission({
    answers: validAnswers,
    auditSessionId: "550e8400-e29b-41d4-a716-446655440000",
    completionSeconds: 72.4,
    attribution: {
      utmSource: " instagram ",
      utmCampaign: " launch ",
      referrer: " https://example.com/post ",
    },
  });

  assert.ok(parsed);
  assert.equal(parsed.auditSessionId, "550e8400-e29b-41d4-a716-446655440000");
  assert.equal(parsed.completionSeconds, 72);
  assert.equal(parsed.attribution.utmSource, "instagram");
  assert.equal(parsed.attribution.utmCampaign, "launch");
  assert.equal(parsed.attribution.referrer, "https://example.com/post");
});

test("submission rejects missing or invalid answers", () => {
  assert.equal(parseAuditSubmission({ answers: { ...validAnswers, q8: 5 } }), null);
  const incomplete = { ...validAnswers } as Record<string, number>;
  delete incomplete.q8;
  assert.equal(parseAuditSubmission({ answers: incomplete }), null);
});

test("invalid optional session id is ignored instead of rejecting the audit", () => {
  const parsed = parseAuditSubmission({ answers: validAnswers, auditSessionId: "not-a-uuid" });
  assert.ok(parsed);
  assert.equal(parsed.auditSessionId, undefined);
});

test("completion time is bounded and negative values are ignored", () => {
  const huge = parseAuditSubmission({ answers: validAnswers, completionSeconds: 999999 });
  assert.ok(huge);
  assert.equal(huge.completionSeconds, 21600);

  const negative = parseAuditSubmission({ answers: validAnswers, completionSeconds: -10 });
  assert.ok(negative);
  assert.equal(negative.completionSeconds, undefined);
});

test("device type detection stores only a coarse category", () => {
  assert.equal(detectDeviceType("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile"), "mobile");
  assert.equal(detectDeviceType("Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)"), "tablet");
  assert.equal(detectDeviceType("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), "desktop");
  assert.equal(detectDeviceType(null), "unknown");
});
