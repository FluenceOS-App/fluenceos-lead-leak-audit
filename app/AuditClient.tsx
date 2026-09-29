"use client";

import { useMemo, useRef, useState } from "react";
import { AUDIT_QUESTIONS } from "@/lib/audit/questions";
import { getCategoryTitle, type ResultContent } from "@/lib/audit/results";
import { trackEvent } from "@/lib/analytics";
import type {
  AnswerValue,
  AuditAnswers,
  AuditResult,
  Category,
  QuestionId,
} from "@/lib/audit/types";

type Stage = "intro" | "questions" | "submitting" | "result";

type PublicAuditResult = Pick<
  AuditResult,
  | "primaryCategory"
  | "primaryType"
  | "secondaryCategory"
  | "secondaryType"
  | "contributingFriction"
  | "downstreamRisk"
  | "collapsedDownstream"
  | "watchAreas"
  | "confidenceState"
  | "mixedPattern"
>;

interface AuditResponse {
  responseId: string;
  auditSessionId: string;
  result: PublicAuditResult;
  content: ResultContent;
}

interface RelatedItem {
  category: Category;
  label: string;
}

const PIPELINE_OS_URL =
  process.env.NEXT_PUBLIC_PIPELINE_OS_URL ?? "https://app.fluenceos.io";

function createSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return "00000000-0000-4000-8000-000000000000";
}

function collectAttribution() {
  if (typeof window === "undefined") return {};

  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
    utmContent: params.get("utm_content") ?? undefined,
    utmTerm: params.get("utm_term") ?? undefined,
    referrer: document.referrer || undefined,
  };
}

function buildRelatedItems(result: PublicAuditResult): RelatedItem[] {
  const seen = new Set<Category>();
  const items: RelatedItem[] = [];

  const add = (category: Category | undefined, label: string) => {
    if (!category || category === result.primaryCategory || seen.has(category)) return;
    seen.add(category);
    items.push({ category, label });
  };

  if (result.secondaryType === "confirmed_leak") {
    add(result.secondaryCategory, "Also showing up now");
  } else if (result.secondaryType === "possible_underlying") {
    add(result.secondaryCategory, "Possible underlying friction");
  } else if (result.secondaryType === "watch_area") {
    add(result.secondaryCategory, "Worth watching");
  }

  add(result.contributingFriction, "Contributing friction");
  add(result.downstreamRisk, "Downstream risk");
  result.collapsedDownstream.forEach((category) => add(category, "Related consequence"));
  result.watchAreas.forEach((category) => add(category, "Worth watching"));

  return items.slice(0, result.primaryType === "no_significant_leak" ? 2 : 1);
}

export default function AuditClient() {
  const [stage, setStage] = useState<Stage>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Partial<AuditAnswers>>({});
  const [response, setResponse] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const sessionIdRef = useRef(createSessionId());
  const startedAtRef = useRef<number | null>(null);

  const question = AUDIT_QUESTIONS[currentIndex];
  const selectedValue = answers[question.id];
  const progress = ((currentIndex + 1) / AUDIT_QUESTIONS.length) * 100;

  const relatedItems = useMemo(
    () => (response ? buildRelatedItems(response.result) : []),
    [response],
  );

  function startAudit() {
    startedAtRef.current = performance.now();
    setStage("questions");
    setCurrentIndex(0);
    setAnswers({});
    setResponse(null);
    setError(null);
    trackEvent("audit_started", { audit_name: "lead_leak_audit" });
  }

  function goBack() {
    if (isTransitioning || currentIndex === 0) return;
    setCurrentIndex((index) => index - 1);
    setError(null);
  }

  function chooseAnswer(questionId: QuestionId, value: AnswerValue) {
    if (isTransitioning || stage !== "questions") return;

    setAnswers((current) => ({ ...current, [questionId]: value }));
    setError(null);

    if (currentIndex < AUDIT_QUESTIONS.length - 1) {
      setIsTransitioning(true);
      window.setTimeout(() => {
        setCurrentIndex((index) => index + 1);
        setIsTransitioning(false);
      }, 170);
    }
  }

  async function submitAudit() {
    const complete = AUDIT_QUESTIONS.every((item) => answers[item.id] !== undefined);
    if (!complete) {
      setError("Please answer all eight questions before viewing your result.");
      return;
    }

    setStage("submitting");
    setError(null);

    const completionSeconds = startedAtRef.current
      ? Math.max(0, Math.round((performance.now() - startedAtRef.current) / 1000))
      : undefined;

    try {
      const res = await fetch("/api/lead-leak-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: answers as AuditAnswers,
          auditSessionId: sessionIdRef.current,
          attribution: collectAttribution(),
          completionSeconds,
        }),
      });

      const payload = (await res.json()) as AuditResponse | { error?: string };
      if (!res.ok || !("result" in payload)) {
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "We could not calculate your result. Please try again.",
        );
      }

      setResponse(payload);
      sessionIdRef.current = payload.auditSessionId;
      trackEvent("audit_completed", {
        audit_name: "lead_leak_audit",
        primary_type: payload.result.primaryType,
        primary_category: payload.result.primaryCategory ?? "none",
        result_variant: payload.content.variant,
        completion_seconds: completionSeconds,
      });
      trackEvent("audit_result_viewed", {
        audit_name: "lead_leak_audit",
        primary_type: payload.result.primaryType,
        primary_category: payload.result.primaryCategory ?? "none",
        result_variant: payload.content.variant,
      });
      setStage("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "We could not calculate your result. Please try again.",
      );
      setStage("questions");
      setCurrentIndex(AUDIT_QUESTIONS.length - 1);
    }
  }

  function retakeAudit() {
    trackEvent("audit_retake", { audit_name: "lead_leak_audit" });
    sessionIdRef.current = createSessionId();
    startedAtRef.current = performance.now();
    setAnswers({});
    setResponse(null);
    setError(null);
    setCurrentIndex(0);
    setStage("questions");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function trackCtaClick() {
    if (!response) return;

    trackEvent("pipeline_os_cta_clicked", {
      audit_name: "lead_leak_audit",
      primary_type: response.result.primaryType,
      primary_category: response.result.primaryCategory ?? "none",
      result_variant: response.content.variant,
      cta_target: PIPELINE_OS_URL,
    });

    void fetch("/api/lead-leak-audit/cta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        responseId: response.responseId,
        auditSessionId: response.auditSessionId,
        ctaTarget: PIPELINE_OS_URL,
        ctaVariant: response.content.variant,
      }),
    }).catch(() => {
      // CTA navigation must never be blocked by analytics failure.
    });
  }

  if (stage === "intro") {
    return (
      <main className="audit-shell intro-shell">
        <section className="audit-panel intro-panel" aria-labelledby="audit-title">
          <div className="brand-lockup" aria-label="FluenceOS">
            <span className="brand-mark" aria-hidden="true">F</span>
            <span>FluenceOS</span>
          </div>

          <p className="eyebrow">Lead Leak Audit</p>
          <h1 id="audit-title">Where are potential clients slipping through the cracks?</h1>
          <p className="lede">
            Eight quick questions can help pinpoint the part of your client-getting
            process that needs attention most — and what to do about it first.
          </p>

          <div className="audit-facts" aria-label="Audit details">
            <span>8 questions</span>
            <span>About 2 minutes</span>
            <span>No email required</span>
          </div>

          <button className="primary-button start-button" type="button" onClick={startAudit}>
            Find my lead leak
            <span aria-hidden="true">→</span>
          </button>

          <p className="privacy-note">
            You’ll get your result immediately. No account, email, or signup required.
          </p>
        </section>
      </main>
    );
  }

  if (stage === "submitting") {
    return (
      <main className="audit-shell">
        <section className="audit-panel loading-panel" aria-live="polite">
          <div className="loading-ring" aria-hidden="true" />
          <p className="eyebrow">Reading the pattern</p>
          <h1>Finding the leak that matters most…</h1>
          <p className="muted-copy">This should only take a moment.</p>
        </section>
      </main>
    );
  }

  if (stage === "result" && response) {
    const { content, result } = response;
    const cleanResult = result.primaryType === "no_significant_leak";

    return (
      <main className="result-shell">
        <div className="result-wrap">
          <header className="result-brand-row">
            <div className="brand-lockup" aria-label="FluenceOS">
              <span className="brand-mark" aria-hidden="true">F</span>
              <span>FluenceOS</span>
            </div>
            <span className="result-kicker">Your Lead Leak Audit</span>
          </header>

          <section className="result-hero">
            <p className="eyebrow">{cleanResult ? "Your result" : "Your primary leak"}</p>
            <h1>{content.title}</h1>
            <p className="result-diagnosis">{content.diagnosis}</p>
          </section>

          {result.mixedPattern && (
            <div className="confidence-note">
              Your answers show a mixed pattern, so this result focuses on the clearest
              behavior showing up rather than forcing a more certain diagnosis.
            </div>
          )}

          {relatedItems.length > 0 && (
            <section className="related-strip" aria-label="Related audit findings">
              {relatedItems.map((item) => (
                <div key={`${item.label}-${item.category}`} className="related-item">
                  <span>{item.label}</span>
                  <strong>{getCategoryTitle(item.category)}</strong>
                </div>
              ))}
            </section>
          )}

          <div className="result-grid">
            <section className="result-card">
              <p className="section-label">Why this matters</p>
              <p>{content.whyItMatters}</p>
            </section>

            <section className="result-card action-card">
              <p className="section-label">What to do next</p>
              <ol className="action-list">
                {content.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ol>
            </section>
          </div>

          <section className="pipeline-bridge">
            <div>
              <p className="section-label">Make the fix easier to keep doing</p>
              <h2>Pipeline OS keeps the next action visible.</h2>
              <p>{content.pipelineBridge}</p>
            </div>
            <a className="primary-button cta-button" href={PIPELINE_OS_URL} onClick={trackCtaClick}>
              {content.ctaLabel}
              <span aria-hidden="true">→</span>
            </a>
            <p className="cta-note">No trial clock. Pipeline OS is free forever.</p>
          </section>

          <div className="result-footer-actions">
            <button className="text-button" type="button" onClick={retakeAudit}>
              Retake the Audit
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="audit-shell question-shell">
      <section className="audit-panel question-panel" aria-labelledby="question-title">
        <header className="question-header">
          <div className="brand-lockup compact" aria-label="FluenceOS">
            <span className="brand-mark" aria-hidden="true">F</span>
            <span>FluenceOS</span>
          </div>
          <span className="question-count">
            {currentIndex + 1} of {AUDIT_QUESTIONS.length}
          </span>
        </header>

        <div className="progress-track" aria-hidden="true">
          <div className="progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="question-content" key={question.id}>
          <p className="eyebrow">Lead Leak Audit</p>
          <h1 id="question-title">{question.prompt}</h1>

          <div className="answer-list" role="radiogroup" aria-labelledby="question-title">
            {question.answers.map((answer, index) => {
              const selected = selectedValue === answer.value;
              return (
                <button
                  key={answer.value}
                  className={`answer-option${selected ? " selected" : ""}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isTransitioning}
                  onClick={() => chooseAnswer(question.id, answer.value)}
                >
                  <span className="answer-key" aria-hidden="true">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{answer.label}</span>
                  <span className="answer-check" aria-hidden="true">✓</span>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}

        <footer className="question-footer">
          <button
            className="back-button"
            type="button"
            onClick={goBack}
            disabled={currentIndex === 0 || isTransitioning}
          >
            ← Back
          </button>

          {currentIndex === AUDIT_QUESTIONS.length - 1 && (
            <button
              className="primary-button result-button"
              type="button"
              onClick={submitAudit}
              disabled={selectedValue === undefined}
            >
              See my result
              <span aria-hidden="true">→</span>
            </button>
          )}
        </footer>
      </section>
    </main>
  );
}
