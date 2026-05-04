/**
 * Narrow retry wrapper for the chained eval's per-scene Gemini call.
 *
 * Retries ONLY on empty/whitespace text responses — a transient upstream
 * blip we've observed once in production where Gemini returned a
 * structurally-valid response object with no `.text` payload. Other
 * failures (content-moderation rejections, network errors, API-down
 * conditions) propagate unmodified, so they remain visible signal rather
 * than being silently masked by the retry.
 *
 * One retry, fixed backoff. The eval is the canary; if a retry is also
 * empty, the failure is stable signal worth investigating, not transient
 * noise to roll past.
 */
export async function withEmptyResponseRetry<T extends { text?: string }>(
  generate: () => Promise<T>,
  scene: number,
  backoffMs = 2000,
): Promise<string> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const response = await generate();
    const text = response.text?.trim();
    if (text) return text;
    if (attempt === 1) {
      console.error(
        `scene ${scene}: empty response from Gemini, retrying once after ${backoffMs}ms backoff`,
      );
      if (backoffMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }
  }
  throw new Error(`Empty response from Gemini at scene ${scene} (after 1 retry)`);
}
