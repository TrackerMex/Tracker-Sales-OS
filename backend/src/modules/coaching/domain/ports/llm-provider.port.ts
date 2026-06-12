export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

export interface LlmCompletionRequest {
  system: string;
  user: string;
  maxTokens: number;
}

export interface LlmProvider {
  complete(req: LlmCompletionRequest): Promise<string>;
}
