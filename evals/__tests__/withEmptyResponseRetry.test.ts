import { describe, expect, it, vi } from 'vitest';
import { withEmptyResponseRetry } from '../withEmptyResponseRetry';

// The chained eval makes 12 sequential Gemini calls. Empty responses are
// transient upstream blips (rate-limit aliasing, server-side latency
// deciding nothing came back) and have surfaced once in production. The
// helper retries empty responses ONLY — content-moderation rejections,
// network errors, and stable API-down conditions still surface as throws.

describe('withEmptyResponseRetry', () => {
  it('returns text on first call when generator succeeds immediately', async () => {
    const generate = vi.fn().mockResolvedValueOnce({ text: 'hello' });
    const result = await withEmptyResponseRetry(generate, 7, 0);
    expect(result).toBe('hello');
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('retries once after empty response and returns text on second call', async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: '' })
      .mockResolvedValueOnce({ text: 'recovered' });
    const result = await withEmptyResponseRetry(generate, 7, 0);
    expect(result).toBe('recovered');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('treats whitespace-only text as empty and retries', async () => {
    const generate = vi
      .fn()
      .mockResolvedValueOnce({ text: '   \n  ' })
      .mockResolvedValueOnce({ text: 'real content' });
    const result = await withEmptyResponseRetry(generate, 7, 0);
    expect(result).toBe('real content');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('treats undefined text as empty and retries', async () => {
    const generate = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({ text: 'recovered' });
    const result = await withEmptyResponseRetry(generate, 7, 0);
    expect(result).toBe('recovered');
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('throws after one retry when both attempts return empty', async () => {
    const generate = vi.fn().mockResolvedValue({ text: '' });
    await expect(withEmptyResponseRetry(generate, 7, 0)).rejects.toThrow(/scene 7.*after 1 retry/i);
    expect(generate).toHaveBeenCalledTimes(2);
  });

  it('does not catch generator errors — content moderation / API down propagate', async () => {
    const generate = vi.fn().mockRejectedValueOnce(new Error('content moderation rejection'));
    await expect(withEmptyResponseRetry(generate, 7, 0)).rejects.toThrow(
      /content moderation rejection/,
    );
    expect(generate).toHaveBeenCalledTimes(1);
  });

  it('returns trimmed text when generator returns text with surrounding whitespace', async () => {
    const generate = vi.fn().mockResolvedValueOnce({ text: '  meaningful answer  \n' });
    const result = await withEmptyResponseRetry(generate, 7, 0);
    expect(result).toBe('meaningful answer');
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
