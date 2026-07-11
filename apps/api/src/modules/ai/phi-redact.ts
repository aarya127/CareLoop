/**
 * Best-effort PHI redaction before sending text to an external LLM.
 *
 * ⚠ Free LLM tiers train on inputs and offer no BAA → NOT HIPAA-eligible. This
 * scrubs the obvious identifiers (patient name, phone, email, dates, long ids),
 * but is NOT a substitute for a BAA / de-identification guarantee. For a real
 * deployment with PHI, use a BAA provider (Anthropic/Azure/Bedrock) or a
 * self-hosted model (Ollama) instead of a free public tier.
 */
export interface RedactHints {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function redactPhi(input: string, hints: RedactHints = {}): string {
  let out = input;

  if (hints.firstName)
    out = out.replace(new RegExp(`\\b${escapeRe(hints.firstName)}\\b`, 'gi'), '[NAME]');
  if (hints.lastName)
    out = out.replace(new RegExp(`\\b${escapeRe(hints.lastName)}\\b`, 'gi'), '[NAME]');
  if (hints.phone) out = out.replace(new RegExp(escapeRe(hints.phone), 'g'), '[PHONE]');

  // Generic identifiers
  out = out.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[EMAIL]');
  out = out.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  out = out.replace(/\+?\d[\d\s().-]{7,}\d/g, '[PHONE]');
  out = out.replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '[DATE]');
  out = out.replace(/\b\d{6,}\b/g, '[ID]');

  return out;
}
