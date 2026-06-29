/**
 * OpenAI-compatible LLM（智谱 / DeepSeek 等）
 * 在 backend/.env 配置 LLM_API_KEY、LLM_BASE_URL、LLM_MODEL
 * 仍兼容旧变量 DEEPSEEK_*
 */
function envFirst(...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return undefined;
}

export function getLlmApiKey(): string | undefined {
  return envFirst('LLM_API_KEY', 'DEEPSEEK_API_KEY');
}

export function isAiRecommendationAvailable(): boolean {
  return Boolean(getLlmApiKey());
}

export const LLM_BASE_URL =
  envFirst('LLM_BASE_URL', 'DEEPSEEK_BASE_URL') || 'https://open.bigmodel.cn/api/paas/v4';

export const LLM_MODEL =
  envFirst('LLM_MODEL', 'DEEPSEEK_MODEL') || 'glm-4-flash';
