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
        model: this.config.get<string>('OPENROUTER_MODEL'),
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
    const data: unknown = await res.json();
    if (!this.isOpenRouterResponse(data)) return '';
    return data.choices?.[0]?.message?.content ?? '';
  }

  private isOpenRouterResponse(
    value: unknown,
  ): value is { choices?: Array<{ message?: { content?: string } }> } {
    if (typeof value !== 'object' || value === null) return false;
    const choices: unknown = 'choices' in value ? value.choices : undefined;
    if (choices === undefined) return true;
    return (
      Array.isArray(choices) &&
      choices.every((choice: unknown) => {
        if (typeof choice !== 'object' || choice === null) return false;
        const message: unknown =
          'message' in choice ? choice.message : undefined;
        if (message === undefined) return true;
        if (typeof message !== 'object' || message === null) return false;
        const content: unknown =
          'content' in message ? message.content : undefined;
        return content === undefined || typeof content === 'string';
      })
    );
  }
}
