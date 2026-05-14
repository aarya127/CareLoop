/**
 * Voice assistant intent detection stub.
 * In production this calls the AI brain service; here it echoes a fallback.
 */

export interface AssistantIntentOptions {
  question: string;
  callSid: string;
  lookaheadDays?: number;
}

export interface AssistantIntentResult {
  answer: string;
  intent?: string;
}

export async function runAssistantIntent(
  options: AssistantIntentOptions,
): Promise<AssistantIntentResult> {
  return {
    answer:
      "I'm sorry, I'm not able to assist with that right now. Please hold while I transfer you to a staff member.",
    intent: "fallback",
  };
}
