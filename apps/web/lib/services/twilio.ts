/**
 * TwiML builder helpers — thin wrappers so route handlers stay readable.
 * Uses plain string construction to avoid adding the twilio SDK as a dependency.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify Twilio's X-Twilio-Signature header per their documented scheme:
 * base64(HMAC-SHA1(authToken, url + sortedParamKeysAndValues)).
 * The url must be the exact public URL Twilio requested, including the query string.
 */
export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string,
  authToken: string,
): boolean {
  if (!signature || !authToken) return false;

  const data =
    url +
    Object.keys(params)
      .sort()
      .map((key) => key + params[key])
      .join("");

  const expected = createHmac("sha1", authToken).update(data, "utf8").digest();
  let provided: Buffer;
  try {
    provided = Buffer.from(signature, "base64");
  } catch {
    return false;
  }
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

/**
 * Validate an inbound Twilio webhook request (form-encoded POST).
 * Fails closed when TWILIO_AUTH_TOKEN is unset in production; in other
 * environments it logs and allows, so local dev without Twilio still works.
 * Returns null when the request is authentic, otherwise a 403 response.
 */
export function requireTwilioRequest(
  requestUrl: { pathname: string; search: string },
  formData: FormData,
  signatureHeader: string | null,
): Response | null {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    if (process.env.NODE_ENV === "production") {
      return new Response(JSON.stringify({ error: "twilio_webhook_not_configured" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.warn("[twilio] TWILIO_AUTH_TOKEN not set — skipping signature check (non-production only)");
    return null;
  }

  // Reconstruct the public URL Twilio signed. Behind a proxy the request URL's
  // host is not the public one, so anchor on the configured base URL.
  const baseUrl = process.env.BASE_URL ?? process.env.APP_BASE_URL ?? "http://localhost:3000";
  const url = `${baseUrl.replace(/\/$/, "")}${requestUrl.pathname}${requestUrl.search}`;

  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") params[key] = value;
  });

  if (!validateTwilioSignature(url, params, signatureHeader ?? "", authToken)) {
    return new Response(JSON.stringify({ error: "invalid_twilio_signature" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }
  return null;
}

function twimlResponse(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

export interface PlayAndGatherOptions {
  audioUrl: string;
  gatherUrl: string;
  speechTimeout?: number | "auto";
  timeoutSeconds?: number;
}

export function buildPlayAndGatherTwiml(opts: PlayAndGatherOptions): string {
  const timeout = opts.speechTimeout ?? 3;
  const gatherTimeout = opts.timeoutSeconds != null ? ` timeout="${opts.timeoutSeconds}"` : "";
  return twimlResponse(
    `<Gather input="speech" action="${opts.gatherUrl}" speechTimeout="${timeout}"${gatherTimeout} method="POST">` +
      `<Play>${opts.audioUrl}</Play>` +
      `</Gather>`,
  );
}

export interface SayAndGatherOptions {
  text: string;
  gatherUrl: string;
  speechTimeout?: number | "auto";
}

export function buildSayAndGatherTwiml(opts: SayAndGatherOptions): string {
  const timeout = opts.speechTimeout ?? 3;
  return twimlResponse(
    `<Gather input="speech" action="${opts.gatherUrl}" speechTimeout="${timeout}" method="POST">` +
      `<Say>${opts.text}</Say>` +
      `</Gather>`,
  );
}

export function buildSayAndHangupTwiml(text: string): string {
  return twimlResponse(`<Say>${text}</Say><Hangup/>`);
}
