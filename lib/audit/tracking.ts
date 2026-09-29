export interface CtaClickPayload {
  responseId: string;
  auditSessionId: string;
  ctaTarget: string;
  ctaVariant: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const cleaned = value.trim();
  if (!cleaned || cleaned.length > maxLength) return null;
  return cleaned;
}

export function parseCtaClickPayload(value: unknown): CtaClickPayload | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;

  const responseId = cleanText(input.responseId, 64);
  const auditSessionId = cleanText(input.auditSessionId, 64);
  const ctaTarget = cleanText(input.ctaTarget, 2048);
  const ctaVariant = cleanText(input.ctaVariant, 128);

  if (!responseId || !UUID_RE.test(responseId)) return null;
  if (!auditSessionId || !UUID_RE.test(auditSessionId)) return null;
  if (!ctaTarget || !ctaVariant) return null;

  try {
    const target = new URL(ctaTarget);
    if (target.protocol !== "https:" && target.protocol !== "http:") return null;
  } catch {
    return null;
  }

  return { responseId, auditSessionId, ctaTarget, ctaVariant };
}
