import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmProvider, LlmCompletionRequest } from '../../domain/ports/llm-provider.port';

@Injectable()
export class AnthropicAdapter implements LlmProvider {
  constructor(private readonly config: ConfigService) {}

  async complete(req: LlmCompletionRequest): Promise<string> {
    const timeout = Number(this.config.get('LLM_TIMEOUT_MS') ?? 3000);
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.config.get<string>('ANTHROPIC_API_KEY') ?? '',
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.config.get('ANTHROPIC_MODEL') ?? 'claude-sonnet-4-6',
        max_tokens: req.maxTokens,
        system: req.system,
        messages: [{ role: 'user', content: req.user }],
      }),
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
    const data = await res.json() as { content?: Array<{ text?: string }> };
    return data.content?.[0]?.text ?? '';
  }
}
