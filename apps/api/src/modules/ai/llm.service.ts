import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

/**
 * Provider-agnostic LLM client. Talks to any OpenAI-compatible
 * `/chat/completions` endpoint, configured entirely by env vars — so the same
 * code works with free providers (swap env only):
 *
 *   Groq       LLM_BASE_URL=https://api.groq.com/openai/v1     LLM_MODEL=llama-3.3-70b-versatile
 *   Gemini     LLM_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai  LLM_MODEL=gemini-2.0-flash
 *   OpenRouter LLM_BASE_URL=https://openrouter.ai/api/v1       LLM_MODEL=meta-llama/llama-3.3-70b-instruct:free
 *   Ollama     LLM_BASE_URL=http://localhost:11434/v1          LLM_MODEL=llama3.1   (no key)
 *
 * Gated behind AI_ENABLED so it is off by default (free tiers are NOT
 * HIPAA-eligible — see phi-redact.ts; callers must redact PHI first).
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);

  private get baseUrl(): string {
    return (process.env.LLM_BASE_URL ?? 'https://api.groq.com/openai/v1').replace(/\/$/, '');
  }
  private get apiKey(): string | undefined {
    return process.env.LLM_API_KEY || undefined;
  }
  private get model(): string {
    return process.env.LLM_MODEL ?? 'llama-3.3-70b-versatile';
  }

  get enabled(): boolean {
    const v = (process.env.AI_ENABLED ?? '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes';
  }

  /**
   * Run a single system+user completion. Requests JSON output; retries once
   * without response_format for providers that reject it. Returns raw content.
   */
  async completeJson(system: string, user: string): Promise<string> {
    if (!this.enabled) {
      throw new ServiceUnavailableException('AI features are disabled (set AI_ENABLED=1)');
    }
    const body = {
      model: this.model,
      temperature: 0.2,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    };

    // First attempt with JSON mode, then a fallback for providers that 400 on it.
    for (const withJson of [true, false]) {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify(
          withJson ? { ...body, response_format: { type: 'json_object' } } : body,
        ),
      });

      if (res.ok) {
        const json: any = await res.json();
        return json?.choices?.[0]?.message?.content ?? '';
      }
      if (res.status === 400 && withJson) {
        this.logger.warn('LLM rejected response_format; retrying without JSON mode');
        continue; // retry without response_format
      }
      const detail = await res.text().catch(() => res.statusText);
      throw new ServiceUnavailableException(
        `LLM request failed (${res.status}): ${detail.slice(0, 300)}`,
      );
    }
    return '';
  }
}
