import type { AppLocale } from '../lib/locale.js';

export type AiReasonFailureCode =
  | 'network'
  | 'rate_limit'
  | 'auth'
  | 'provider_error'
  | 'bad_response'
  | 'validation';

export interface AiReasonFailure {
  code: AiReasonFailureCode;
  providerMessage?: string;
}

function failureDetail(locale: AppLocale, failure: AiReasonFailure): string {
  switch (failure.code) {
    case 'rate_limit':
      return failure.providerMessage ??
        (locale === 'en' ? 'model rate limit — try again later' : '模型访问量过大，请稍后再试');
    case 'auth':
      return failure.providerMessage ??
        (locale === 'en' ? 'invalid or expired API key' : 'API Key 无效或已过期');
    case 'network':
      return locale === 'en' ? 'could not reach LLM provider' : '无法连接大模型服务';
    case 'bad_response':
      return locale === 'en' ? 'unexpected response format' : '大模型返回格式异常';
    case 'validation':
      return locale === 'en' ?
          'generated text did not pass safety checks'
        : '生成内容未通过校验（需包含歌名且不含其他曲目）';
    case 'provider_error':
      return failure.providerMessage ??
        (locale === 'en' ? 'provider returned an error' : '大模型服务商返回错误');
    default:
      return locale === 'en' ? 'unknown error' : '未知错误';
  }
}

export function formatAiFallbackMessage(locale: AppLocale, failure?: AiReasonFailure): string {
  if (!failure) {
    return locale === 'en' ?
        'AI unavailable; using rule-based reasons.'
      : 'AI 暂时不可用，已使用规则推荐。';
  }

  const detail = failureDetail(locale, failure);
  return locale === 'en' ?
      `AI unavailable (${detail}); using rule-based reasons.`
    : `AI 暂时不可用（${detail}），已使用规则推荐。`;
}
