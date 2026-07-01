import { describe, it, expect } from 'vitest';
import { formatAiFallbackMessage } from './aiFallbackMessage.js';

describe('formatAiFallbackMessage', () => {
  it('includes rate limit detail in Chinese', () => {
    const msg = formatAiFallbackMessage('zh', {
      code: 'rate_limit',
      providerMessage: '该模型当前访问量过大，请您稍后再试',
    });
    expect(msg).toContain('该模型当前访问量过大');
    expect(msg).toContain('规则推荐');
  });

  it('includes auth detail in English', () => {
    const msg = formatAiFallbackMessage('en', { code: 'auth' });
    expect(msg).toContain('invalid or expired API key');
    expect(msg).toContain('rule-based');
  });
});
