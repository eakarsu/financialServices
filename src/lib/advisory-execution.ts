export class AdvisoryError extends Error { constructor(message: string, public status = 502) { super(message); } }
export function execution(signal?: AbortSignal, timeout = 60_000) {
  const controller = new AbortController();
  const cancel = () => controller.abort(new AdvisoryError('Request cancelled.', 499));
  if (signal?.aborted) cancel(); else signal?.addEventListener('abort', cancel, { once: true });
  const timer = setTimeout(() => controller.abort(new AdvisoryError('AI provider timed out. Try again.', 504)), timeout);
  const check = () => { if (controller.signal.aborted) throw controller.signal.reason; };
  return { signal: controller.signal, check, close() { clearTimeout(timer); signal?.removeEventListener('abort', cancel); } };
}
export function providerResult(payload: any, response: Response, model: string) {
  if (!response.ok) throw new AdvisoryError(response.status === 429 ? 'AI provider rate limit reached. Try again shortly.' : 'AI provider request failed.', response.status === 429 ? 429 : 502);
  const choice = payload?.choices?.[0], content = choice?.message?.content;
  if (choice?.message?.refusal || ['length', 'content_filter'].includes(choice?.finish_reason) || typeof content !== 'string' || !content.trim() || content.length > 100_000) throw new AdvisoryError('AI provider returned an incomplete or unavailable response.');
  const id = String(payload?.id || response.headers.get('x-request-id') || '').trim();
  if (!id) throw new AdvisoryError('AI provider response is missing its receipt.');
  return { content: content.trim(), receipt: { id, created: payload?.created ?? null, upstreamModel: String(payload?.model || model) } };
}
