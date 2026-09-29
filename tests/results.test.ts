import test from "node:test";
import assert from "node:assert/strict";
import { buildPrimaryResultContent, getCategoryTitle } from "../lib/audit/results";
import { scoreAudit } from "../lib/audit/scoring";
import type { AuditAnswers } from "../lib/audit/types";

const healthy: AuditAnswers = {
  q1: 1, q2: 1, q3: 1, q4: 1, q5: 1, q6: 1, q7: 1, q8: 1,
};

function answers(overrides: Partial<AuditAnswers>): AuditAnswers {
  return { ...healthy, ...overrides };
}

function contentFor(input: AuditAnswers) {
  const result = scoreAudit(input);
  return buildPrimaryResultContent(input, result);
}

test("healthy result uses clean-outcome content", () => {
  const content = contentFor(healthy);
  assert.equal(content.category, null);
  assert.equal(content.title, "Your Pipeline Looks Pretty Solid Right Now");
  assert.match(content.ctaLabel, /free forever/i);
});

test("Missing Next Actions uses combined copy when conversation clarity and visibility both break", () => {
  const content = contentFor(answers({ q1: 4, q6: 3, q8: 3 }));
  assert.equal(content.category, "missing_next_actions");
  assert.equal(content.variant, "combined");
  assert.match(content.diagnosis, /double problem/i);
});

test("Missing Next Actions can use current-visibility copy", () => {
  const content = contentFor(answers({ q1: 2, q6: 4, q8: 3 }));
  assert.equal(content.category, "missing_next_actions");
  assert.equal(content.variant, "current_visibility");
  assert.match(content.diagnosis, /reconstruct status/i);
});

test("Follow-Up identifies early-stage breakdown", () => {
  const content = contentFor(answers({ q2: 4, q7: 1 }));
  assert.equal(content.category, "follow_up");
  assert.equal(content.variant, "early_stage");
  assert.match(content.diagnosis, /promising conversations/i);
});

test("Follow-Up identifies proposal-stage breakdown", () => {
  const content = contentFor(answers({ q2: 1, q7: 4 }));
  assert.equal(content.category, "follow_up");
  assert.equal(content.variant, "proposal_stage");
  assert.match(content.diagnosis, /after proposals are sent/i);
  assert.match(content.pipelineBridge, /proposal follow-up/i);
});

test("Follow-Up identifies breakdown at both stages", () => {
  const content = contentFor(answers({ q2: 4, q7: 4 }));
  assert.equal(content.variant, "both_stages");
  assert.match(content.diagnosis, /multiple points/i);
});

test("Scattered current leak uses current-impact copy", () => {
  const content = contentFor(answers({ q3: 4, q6: 4, q8: 3 }));
  assert.equal(content.category, "scattered_leads");
  assert.equal(content.variant, "current_leak");
  assert.match(content.diagnosis, /already making it harder/i);
});

test("visitor-facing category names avoid prospect terminology", () => {
  assert.equal(getCategoryTitle("scattered_leads"), "Your Potential Clients Are Scattered Across Too Many Places");
  assert.equal(getCategoryTitle("dormant_prospects"), "Potential Clients Are Going Cold");
  assert.doesNotMatch(getCategoryTitle("dormant_prospects"), /prospect/i);
});

test("every primary CTA communicates free forever", () => {
  const profiles: AuditAnswers[] = [
    healthy,
    answers({ q1: 4, q6: 3, q8: 3 }),
    answers({ q2: 4 }),
    answers({ q3: 4, q6: 4, q8: 3 }),
    answers({ q5: 4 }),
    answers({ q4: 4 }),
  ];

  for (const profile of profiles) {
    assert.match(contentFor(profile).ctaLabel, /free forever/i);
  }
});
