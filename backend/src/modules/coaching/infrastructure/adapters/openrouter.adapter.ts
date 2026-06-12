import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  LlmProvider,
  LlmCompletionRequest,
} from '../../domain/ports/llm-provider.port';

@Injectable()
export class OpenRouterAdapter implements LlmProvider {
  constructor(private readonly config: ConfigService) {}

  async complete(req: LlmCompletionRequest): Promise<string> {
    const timeout = Number(this.config.get('LLM_TIMEOUT_MS') ?? 3000);
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.get('OPENROUTER_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('OPENROUTER_MODEL'),
        max_tokens: req.maxTokens,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
      }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok)
      throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? '';
  }
}
