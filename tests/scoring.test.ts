import test from "node:test";
import assert from "node:assert/strict";
import { scoreAudit } from "../lib/audit/scoring";
import type { AuditAnswers } from "../lib/audit/types";

const healthy: AuditAnswers = {
  q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1,
};

function answers(overrides: Partial<AuditAnswers>): AuditAnswers {
  return { ...healthy, ...overrides };
}

test("healthy profile returns no significant current leak", () => {
  const result = scoreAudit(healthy);
  assert.equal(result.primaryType, "no_significant_leak");
  assert.equal(result.primaryCategory, null);
  assert.deepEqual(result.watchAreas, []);
});

test("messy but functioning tracking is a Scattered watch area, not a current leak", () => {
  const result = scoreAudit(answers({ q3: 4 }));
  assert.equal(result.primaryType, "no_significant_leak");
  assert.deepEqual(result.watchAreas, ["scattered_leads"]);
  assert.equal(result.categories.scattered_leads.impactState, "risk");
});

test("fragmentation with visibility impact diagnoses Scattered as root and MNA downstream", () => {
  const result = scoreAudit(answers({ q3: 4, q6: 4, q8: 3 }));
  assert.equal(result.primaryCategory, "scattered_leads");
  assert.ok(result.collapsedDownstream.includes("missing_next_actions"));
  assert.ok(result.reasonCodes.includes("ROOT_SCATTERED_TO_MNA"));
});

test("follow-up breakdown at both stages diagnoses Follow-Up", () => {
  const result = scoreAudit(answers({ q2: 4, q7: 4 }));
  assert.equal(result.primaryCategory, "follow_up");
  assert.equal(result.categories.follow_up.impactState, "current_leak");
});

test("proposal-stage miss alone is enough for a current Follow-Up leak", () => {
  const result = scoreAudit(answers({ q7: 4 }));
  assert.equal(result.primaryCategory, "follow_up");
  assert.equal(result.categories.follow_up.impactState, "current_leak");
});

test("proposal follow-up current leak outranks scattered structural risk", () => {
  const result = scoreAudit(answers({ q3: 4, q7: 4 }));
  assert.equal(result.primaryCategory, "follow_up");
  assert.equal(result.categories.scattered_leads.impactState, "risk");
});

test("supported MNA to Follow-Up causal relationship makes MNA root", () => {
  const result = scoreAudit(answers({ q1: 4, q2: 4, q6: 3, q7: 3, q8: 3 }));
  assert.equal(result.primaryCategory, "missing_next_actions");
  assert.ok(result.collapsedDownstream.includes("follow_up"));
  assert.ok(result.reasonCodes.includes("ROOT_MNA_TO_FOLLOWUP"));
});

test("Busy and Dormant tied leaks use deterministic fallback without invented causality", () => {
  const result = scoreAudit(answers({ q4: 4, q5: 4 }));
  assert.equal(result.primaryCategory, "dormant_prospects");
  assert.equal(result.secondaryCategory, "busy_stops_business_development");
  assert.ok(!result.reasonCodes.some((code) => code.startsWith("ROOT_")));
});

test("supported full causal chain collapses downstream and preserves unrelated Busy secondary", () => {
  const result = scoreAudit(answers({ q1: 4, q2: 4, q3: 4, q4: 4, q6: 4, q7: 4, q8: 3 }));
  assert.equal(result.primaryCategory, "scattered_leads");
  assert.ok(result.collapsedDownstream.includes("missing_next_actions"));
  assert.ok(result.collapsedDownstream.includes("follow_up"));
  assert.equal(result.secondaryCategory, "busy_stops_business_development");
  assert.ok(result.reasonCodes.includes("CAUSAL_CHAIN_COLLAPSED"));
});

test("multiple moderate risks with clear visibility do not manufacture a current leak", () => {
  const result = scoreAudit(answers({ q1: 3, q2: 3, q3: 3, q4: 2, q5: 3, q6: 2, q7: 1, q8: 1 }));
  assert.equal(result.primaryType, "no_significant_leak");
  assert.equal(result.watchAreas.length, 2);
});

test("Follow-Up can be primary while Scattered is contributing friction", () => {
  const result = scoreAudit(answers({ q2: 4, q3: 2, q6: 4, q7: 2, q8: 2 }));
  assert.equal(result.primaryCategory, "follow_up");
  // MNA is also current due q6-D; depending on diagnosis comparison it may be secondary.
  // The important V1 invariant is that Scattered does not replace the confirmed operational leak.
  assert.notEqual(result.primaryCategory, "scattered_leads");
});

test("contradictory tracking/visibility answers reduce confidence and suppress Scattered->MNA causality", () => {
  const result = scoreAudit(answers({ q1: 1, q3: 1, q6: 4, q8: 3 }));
  assert.equal(result.mixedPattern, true);
  assert.equal(result.confidenceState, "reduced");
  assert.ok(result.reasonCodes.includes("TRACKING_VISIBILITY_CONFLICT"));
  assert.ok(!result.reasonCodes.includes("ROOT_SCATTERED_TO_MNA"));
});

test("Q8 cannot create a diagnosis by itself", () => {
  const result = scoreAudit(answers({ q8: 4 }));
  assert.equal(result.primaryType, "no_significant_leak");
  assert.equal(result.primaryCategory, null);
});
