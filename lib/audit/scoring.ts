import type {
  AnswerValue,
  AuditAnswers,
  AuditContext,
  AuditResult,
  Category,
  CategoryState,
  ConfidenceState,
} from "./types";

const CATEGORIES: Category[] = [
  "missing_next_actions",
  "follow_up",
  "scattered_leads",
  "dormant_prospects",
  "busy_stops_business_development",
];

const FALLBACK_ORDER: Category[] = [
  "missing_next_actions",
  "follow_up",
  "scattered_leads",
  "dormant_prospects",
  "busy_stops_business_development",
];

const MAX_DIRECT: Record<Category, number> = {
  missing_next_actions: 6,
  follow_up: 6,
  scattered_leads: 3,
  dormant_prospects: 3,
  busy_stops_business_development: 3,
};

function evidenceFromLinearAnswer(answer: AnswerValue): 0 | 1 | 2 | 3 {
  return (answer - 1) as 0 | 1 | 2 | 3;
}

function evidenceFromQ6(answer: AnswerValue): 0 | 1 | 3 {
  if (answer === 1) return 0;
  if (answer === 2) return 1;
  return 3;
}

function initializeCategoryStates(): Record<Category, CategoryState> {
  const states = {} as Record<Category, CategoryState>;
  for (const category of CATEGORIES) {
    states[category] = {
      category,
      directPoints: 0,
      maxDirectPoints: MAX_DIRECT[category],
      directStrength: 0,
      supportingSignals: 0,
      strongestDirectSignal: 0,
      impactState: "healthy",
      confidenceState: "normal",
      reasonCodes: [],
    };
  }
  return states;
}

function addDirect(
  state: CategoryState,
  value: 0 | 1 | 2 | 3,
  reasonCode: string,
): void {
  state.directPoints += value;
  if (value > state.strongestDirectSignal) state.strongestDirectSignal = value;
  if (value > 0) state.reasonCodes.push(reasonCode);
}

function signalLabel(value: 0 | 1 | 2 | 3): "NONE" | "WEAK" | "MODERATE" | "STRONG" {
  return ["NONE", "WEAK", "MODERATE", "STRONG"][value] as
    | "NONE"
    | "WEAK"
    | "MODERATE"
    | "STRONG";
}

function applyDirectEvidence(answers: AuditAnswers, states: Record<Category, CategoryState>): void {
  const q1 = evidenceFromLinearAnswer(answers.q1);
  const q2 = evidenceFromLinearAnswer(answers.q2);
  const q3 = evidenceFromLinearAnswer(answers.q3);
  const q4 = evidenceFromLinearAnswer(answers.q4);
  const q5 = evidenceFromLinearAnswer(answers.q5);
  const q6 = evidenceFromQ6(answers.q6);
  const q7 = evidenceFromLinearAnswer(answers.q7);

  addDirect(states.missing_next_actions, q1, `Q1_MNA_${signalLabel(q1)}`);
  addDirect(states.follow_up, q2, `Q2_FOLLOWUP_${signalLabel(q2)}`);
  addDirect(states.scattered_leads, q3, `Q3_SCATTERED_${signalLabel(q3)}`);
  addDirect(states.busy_stops_business_development, q4, `Q4_BUSY_${signalLabel(q4)}`);
  addDirect(states.dormant_prospects, q5, `Q5_DORMANT_${signalLabel(q5)}`);
  addDirect(states.missing_next_actions, q6, `Q6_MNA_${signalLabel(q6)}`);
  addDirect(states.follow_up, q7, `Q7_FOLLOWUP_${signalLabel(q7)}`);
}

function calculateNormalizedStrength(states: Record<Category, CategoryState>): void {
  for (const state of Object.values(states)) {
    state.directStrength = state.directPoints / state.maxDirectPoints;
  }
}

function applySupportingSignals(
  answers: AuditAnswers,
  states: Record<Category, CategoryState>,
  context: AuditContext,
): void {
  if (answers.q6 === 4) {
    states.scattered_leads.supportingSignals += 1;
    states.scattered_leads.reasonCodes.push("Q6_SUPPORTS_SCATTERED");
  }

  if (answers.q8 === 3) {
    if (states.missing_next_actions.directPoints > 0) {
      states.missing_next_actions.supportingSignals += 1;
      states.missing_next_actions.reasonCodes.push("Q8_REINFORCES_MNA");
    }
    if (states.scattered_leads.directPoints > 0) {
      states.scattered_leads.supportingSignals += 1;
      states.scattered_leads.reasonCodes.push("Q8_REINFORCES_SCATTERED");
    }
  }

  if (answers.q8 === 4) {
    context.reasonCodes.push("Q8_STRONG_OPERATIONAL_UNCERTAINTY");
  }
}

function classifyImpact(answers: AuditAnswers, states: Record<Category, CategoryState>): void {
  const mna = states.missing_next_actions;
  if (mna.directPoints > 0) {
    const impacted = answers.q6 >= 3 || answers.q8 >= 3;
    mna.impactState = impacted ? "current_leak" : "risk";
    mna.reasonCodes.push(impacted ? "MNA_IMPACT_CONFIRMED" : "MNA_STRUCTURAL_RISK");
  }

  const follow = states.follow_up;
  if (follow.directPoints > 0) {
    const q2 = evidenceFromLinearAnswer(answers.q2);
    const q7 = evidenceFromLinearAnswer(answers.q7);
    const impacted = answers.q2 === 4 || answers.q7 === 4 || (q2 >= 2 && q7 >= 2);
    follow.impactState = impacted ? "current_leak" : "risk";
    follow.reasonCodes.push(impacted ? "FOLLOWUP_IMPACT_CONFIRMED" : "FOLLOWUP_STRUCTURAL_RISK");
  }

  const scattered = states.scattered_leads;
  if (scattered.directPoints > 0) {
    const impacted = scattered.directPoints >= 2 && (answers.q6 === 4 || answers.q8 >= 3);
    scattered.impactState = impacted ? "current_leak" : "risk";
    scattered.reasonCodes.push(impacted ? "SCATTERED_IMPACT_CONFIRMED" : "SCATTERED_STRUCTURAL_RISK");
  }

  const dormant = states.dormant_prospects;
  if (answers.q5 === 4) {
    dormant.impactState = "current_leak";
    dormant.reasonCodes.push("DORMANT_IMPACT_CONFIRMED");
  } else if (answers.q5 >= 2) {
    dormant.impactState = "risk";
    dormant.reasonCodes.push("DORMANT_STRUCTURAL_RISK");
  }

  const busy = states.busy_stops_business_development;
  if (answers.q4 >= 3) {
    busy.impactState = "current_leak";
    busy.reasonCodes.push("BUSY_IMPACT_CONFIRMED");
  } else if (answers.q4 === 2) {
    busy.impactState = "risk";
    busy.reasonCodes.push("BUSY_STRUCTURAL_RISK");
  }
}

function applyCoherence(
  answers: AuditAnswers,
  states: Record<Category, CategoryState>,
  context: AuditContext,
): void {
  const conflicts: string[] = [];

  if (answers.q3 === 1 && (answers.q6 === 4 || answers.q8 === 3)) {
    conflicts.push("TRACKING_VISIBILITY_CONFLICT");
  }
  if (answers.q1 === 1 && answers.q6 === 4) {
    conflicts.push("NEXT_ACTION_VISIBILITY_CONFLICT");
  }

  if (conflicts.length === 0) return;

  context.mixedPattern = true;
  context.conflicts.push(...conflicts);
  context.reasonCodes.push("MIXED_PATTERN", "CONFIDENCE_REDUCED_CONTRADICTION", ...conflicts);

  for (const state of Object.values(states)) {
    if (state.impactState !== "healthy") {
      state.confidenceState = "reduced";
      state.reasonCodes.push("CONFIDENCE_REDUCED_CONTRADICTION");
    }
  }
}

function compareCandidates(a: CategoryState, b: CategoryState): number {
  if (a.directStrength !== b.directStrength) return b.directStrength - a.directStrength;
  if (a.supportingSignals !== b.supportingSignals) return b.supportingSignals - a.supportingSignals;
  if (a.strongestDirectSignal !== b.strongestDirectSignal) return b.strongestDirectSignal - a.strongestDirectSignal;
  return FALLBACK_ORDER.indexOf(a.category) - FALLBACK_ORDER.indexOf(b.category);
}

function selectPrimary(
  candidates: Category[],
  states: Record<Category, CategoryState>,
  reasonCodes: string[],
): Category {
  if (candidates.length === 1) return candidates[0];

  const sorted = [...candidates].sort((a, b) => states[b].directStrength - states[a].directStrength);
  const first = sorted[0];
  const second = sorted[1];
  const gap = states[first].directStrength - states[second].directStrength;

  if (gap > 0.10) return first;

  reasonCodes.push("TIE_WITHIN_10PTS");

  const tiedByStrength = sorted.filter(
    (category) => states[first].directStrength - states[category].directStrength <= 0.10,
  );

  const maxSupport = Math.max(...tiedByStrength.map((c) => states[c].supportingSignals));
  const supportWinners = tiedByStrength.filter((c) => states[c].supportingSignals === maxSupport);
  if (supportWinners.length === 1) {
    reasonCodes.push("TIEBROKEN_BY_CORROBORATION");
    return supportWinners[0];
  }

  const maxStrongest = Math.max(...supportWinners.map((c) => states[c].strongestDirectSignal));
  const directWinners = supportWinners.filter((c) => states[c].strongestDirectSignal === maxStrongest);
  if (directWinners.length === 1) {
    reasonCodes.push("TIEBROKEN_BY_STRONGEST_DIRECT");
    return directWinners[0];
  }

  reasonCodes.push("TIEBROKEN_BY_FALLBACK_ORDER");
  return [...directWinners].sort(
    (a, b) => FALLBACK_ORDER.indexOf(a) - FALLBACK_ORDER.indexOf(b),
  )[0];
}

function applyRootCausePrecedence(
  answers: AuditAnswers,
  currentLeaks: Category[],
  states: Record<Category, CategoryState>,
  context: AuditContext,
  reasonCodes: string[],
): { candidates: Category[]; collapsedDownstream: Category[] } {
  const candidates = new Set(currentLeaks);
  const collapsed = new Set<Category>();
  const hasTrackingConflict = context.conflicts.includes("TRACKING_VISIBILITY_CONFLICT");
  const hasNextActionConflict = context.conflicts.includes("NEXT_ACTION_VISIBILITY_CONFLICT");

  const scatteredToMna =
    candidates.has("scattered_leads") &&
    candidates.has("missing_next_actions") &&
    evidenceFromLinearAnswer(answers.q3) >= 2 &&
    answers.q6 === 4 &&
    answers.q8 >= 3 &&
    !hasTrackingConflict;

  if (scatteredToMna) {
    candidates.delete("missing_next_actions");
    collapsed.add("missing_next_actions");
    reasonCodes.push("ROOT_SCATTERED_TO_MNA");
  }

  const mnaEligibleAsRoot = currentLeaks.includes("missing_next_actions");
  const mnaToFollowup =
    mnaEligibleAsRoot &&
    candidates.has("follow_up") &&
    answers.q6 >= 3 &&
    (answers.q2 >= 3 || answers.q7 >= 3) &&
    !hasNextActionConflict;

  if (mnaToFollowup) {
    candidates.delete("follow_up");
    collapsed.add("follow_up");
    reasonCodes.push("ROOT_MNA_TO_FOLLOWUP");

    if (scatteredToMna) {
      reasonCodes.push("CAUSAL_CHAIN_COLLAPSED");
    }
  }

  return { candidates: [...candidates], collapsedDownstream: [...collapsed] };
}

function pickWatchAreas(states: Record<Category, CategoryState>): Category[] {
  return CATEGORIES
    .filter((category) => states[category].impactState === "risk")
    .sort((a, b) => compareCandidates(states[a], states[b]))
    .slice(0, 2);
}

function overallConfidence(states: Record<Category, CategoryState>, mixedPattern: boolean): ConfidenceState {
  if (mixedPattern) return "reduced";
  if (Object.values(states).some((s) => s.confidenceState === "reinforced")) return "reinforced";
  return "normal";
}

function reinforceQ8DLeader(
  answers: AuditAnswers,
  primary: Category | null,
  states: Record<Category, CategoryState>,
  context: AuditContext,
): void {
  if (answers.q8 !== 4 || primary === null || context.mixedPattern) return;
  const state = states[primary];
  if (state.impactState === "healthy") return;
  state.confidenceState = "reinforced";
  state.reasonCodes.push("Q8_REINFORCES_LEADING_CATEGORY", "CONFIDENCE_REINFORCED");
}

export function scoreAudit(answers: AuditAnswers): AuditResult {
  const values = Object.values(answers);
  if (values.length !== 8 || values.some((v) => ![1, 2, 3, 4].includes(v))) {
    throw new Error("Audit requires all eight answers with values 1-4.");
  }

  const states = initializeCategoryStates();
  const context: AuditContext = {
    q8State: answers.q8,
    mixedPattern: false,
    reasonCodes: [],
    conflicts: [],
  };
  const resultReasonCodes: string[] = [];

  applyDirectEvidence(answers, states);
  calculateNormalizedStrength(states);
  applySupportingSignals(answers, states, context);
  classifyImpact(answers, states);
  applyCoherence(answers, states, context);

  const currentLeaks = CATEGORIES.filter((category) => states[category].impactState === "current_leak");

  if (currentLeaks.length === 0) {
    const watchAreas = pickWatchAreas(states);
    resultReasonCodes.push("NO_SIGNIFICANT_CURRENT_LEAK");
    if (watchAreas.length > 0) resultReasonCodes.push("WATCH_AREA_PRESENT");

    return {
      primaryCategory: null,
      primaryType: "no_significant_leak",
      collapsedDownstream: [],
      watchAreas,
      confidenceState: overallConfidence(states, context.mixedPattern),
      mixedPattern: context.mixedPattern,
      reasonCodes: [...context.reasonCodes, ...resultReasonCodes],
      categories: states,
    };
  }

  const rootResolution = applyRootCausePrecedence(
    answers,
    currentLeaks,
    states,
    context,
    resultReasonCodes,
  );

  const primary = selectPrimary(rootResolution.candidates, states, resultReasonCodes);
  resultReasonCodes.push("PRIMARY_CURRENT_LEAK");

  reinforceQ8DLeader(answers, primary, states, context);

  const unrelatedConfirmed = currentLeaks.filter(
    (category) => category !== primary && !rootResolution.collapsedDownstream.includes(category),
  );

  let secondaryCategory: Category | undefined;
  if (unrelatedConfirmed.length > 0) {
    secondaryCategory = selectPrimary(unrelatedConfirmed, states, resultReasonCodes);
    resultReasonCodes.push("SECONDARY_CONFIRMED_LEAK");
  }

  const risks = CATEGORIES.filter((category) => states[category].impactState === "risk").sort((a, b) =>
    compareCandidates(states[a], states[b]),
  );

  let contributingFriction: Category | undefined;
  let downstreamRisk: Category | undefined;

  if (!secondaryCategory && risks.length > 0) {
    if (
      primary === "follow_up" &&
      risks.includes("scattered_leads") &&
      (answers.q6 === 4 || answers.q8 >= 3)
    ) {
      contributingFriction = "scattered_leads";
      resultReasonCodes.push("CONTRIBUTING_FRICTION_SCATTERED");
    } else {
      downstreamRisk = risks[0];
      resultReasonCodes.push("WATCH_AREA_PRESENT");
    }
  }

  return {
    primaryCategory: primary,
    primaryType: "current_leak",
    ...(secondaryCategory
      ? { secondaryCategory, secondaryType: "confirmed_leak" as const }
      : {}),
    ...(contributingFriction ? { contributingFriction } : {}),
    ...(downstreamRisk ? { downstreamRisk } : {}),
    collapsedDownstream: rootResolution.collapsedDownstream,
    watchAreas: [],
    confidenceState: overallConfidence(states, context.mixedPattern),
    mixedPattern: context.mixedPattern,
    reasonCodes: [...context.reasonCodes, ...resultReasonCodes],
    categories: states,
  };
}
