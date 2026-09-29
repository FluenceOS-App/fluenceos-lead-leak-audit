export type AnswerValue = 1 | 2 | 3 | 4;

export type QuestionId = "q1" | "q2" | "q3" | "q4" | "q5" | "q6" | "q7" | "q8";

export type AuditAnswers = Record<QuestionId, AnswerValue>;

export type Category =
  | "missing_next_actions"
  | "follow_up"
  | "scattered_leads"
  | "dormant_prospects"
  | "busy_stops_business_development";

export type ImpactState = "healthy" | "risk" | "current_leak";
export type ConfidenceState = "normal" | "reduced" | "reinforced";

export interface CategoryState {
  category: Category;
  directPoints: number;
  maxDirectPoints: number;
  directStrength: number;
  supportingSignals: number;
  strongestDirectSignal: 0 | 1 | 2 | 3;
  impactState: ImpactState;
  confidenceState: ConfidenceState;
  reasonCodes: string[];
}

export interface AuditContext {
  q8State: AnswerValue;
  mixedPattern: boolean;
  reasonCodes: string[];
  conflicts: string[];
}

export type PrimaryType = "current_leak" | "no_significant_leak";
export type SecondaryType = "confirmed_leak" | "possible_underlying" | "watch_area";

export interface AuditResult {
  primaryCategory: Category | null;
  primaryType: PrimaryType;
  secondaryCategory?: Category;
  secondaryType?: SecondaryType;
  contributingFriction?: Category;
  downstreamRisk?: Category;
  collapsedDownstream: Category[];
  watchAreas: Category[];
  confidenceState: ConfidenceState;
  mixedPattern: boolean;
  reasonCodes: string[];
  categories: Record<Category, CategoryState>;
}

export interface AuditQuestion {
  id: QuestionId;
  prompt: string;
  answers: ReadonlyArray<{ value: AnswerValue; label: string }>;
}
