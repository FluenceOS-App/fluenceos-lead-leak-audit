import type { AuditAnswers, AnswerValue, QuestionId } from "./types";

export interface AuditAttribution {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
}

export interface AuditSubmissionInput {
  answers: AuditAnswers;
  auditSessionId?: string;
  attribution: AuditAttribution;
  completionSeconds?: number;
}

const QUESTION_IDS: QuestionId[] = ["q1", "q2", "q3", "q4", "q5", "q6", "q7", "q8"];
const MAX_ATTRIBUTION_LENGTH = 250;
const MAX_REFERRER_LENGTH = 1000;
const MAX_COMPLETION_SECONDS = 60 * 60 * 6;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAnswerValue(value: unknown): value is AnswerValue {
  return value === 1 || value === 2 || value === 3 || value === 4;
}

function cleanOptionalString(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean) return undefined;
  return clean.slice(0, maxLength);
}

function parseAnswers(value: unknown): AuditAnswers | null {
  if (!isObject(value)) return null;

  const answers = {} as AuditAnswers;
  for (const questionId of QUESTION_IDS) {
    const answer = value[questionId];
    if (!isAnswerValue(answer)) return null;
    answers[questionId] = answer;
  }

  return answers;
}

function parseAttribution(value: unknown): AuditAttribution {
  if (!isObject(value)) return {};

  return {
    utmSource: cleanOptionalString(value.utmSource, MAX_ATTRIBUTION_LENGTH),
    utmMedium: cleanOptionalString(value.utmMedium, MAX_ATTRIBUTION_LENGTH),
    utmCampaign: cleanOptionalString(value.utmCampaign, MAX_ATTRIBUTION_LENGTH),
    utmContent: cleanOptionalString(value.utmContent, MAX_ATTRIBUTION_LENGTH),
    utmTerm: cleanOptionalString(value.utmTerm, MAX_ATTRIBUTION_LENGTH),
    referrer: cleanOptionalString(value.referrer, MAX_REFERRER_LENGTH),
  };
}

function parseCompletionSeconds(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  const rounded = Math.round(value);
  if (rounded < 0) return undefined;
  return Math.min(rounded, MAX_COMPLETION_SECONDS);
}

function parseAuditSessionId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const clean = value.trim();
  if (!clean) return undefined;

  // UUID format only. The route can generate one when the client does not provide it.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clean)) {
    return undefined;
  }

  return clean;
}

export function parseAuditSubmission(value: unknown): AuditSubmissionInput | null {
  if (!isObject(value)) return null;

  const answers = parseAnswers(value.answers);
  if (!answers) return null;

  return {
    answers,
    auditSessionId: parseAuditSessionId(value.auditSessionId),
    attribution: parseAttribution(value.attribution),
    completionSeconds: parseCompletionSeconds(value.completionSeconds),
  };
}

export function detectDeviceType(userAgent: string | null): "mobile" | "tablet" | "desktop" | "unknown" {
  if (!userAgent) return "unknown";
  const ua = userAgent.toLowerCase();

  if (/ipad|tablet|kindle|silk|playbook/.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android.*mobile|windows phone/.test(ua)) return "mobile";
  if (/android/.test(ua)) return "tablet";
  return "desktop";
}
