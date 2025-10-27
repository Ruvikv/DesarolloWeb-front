// Helper for fetch with a robust timeout using AbortController
// Ensures that in environments where AbortSignal.timeout is not available,
// requests will still be aborted after the specified timeout to avoid hanging UI.
import { API_CONFIG } from '../config/api.js';
export async function fetchWithTimeout(
  input: RequestInfo,
  init: (RequestInit & { timeoutMs?: number }) = {}
): Promise<Response> {
  const { timeoutMs = API_CONFIG.TIMEOUT ?? 30000, signal: providedSignal, ...rest } = init as any;

  // If a signal is already provided, we respect it. Otherwise, create our own.
  let controller: AbortController | null = null;
  let signal: AbortSignal | undefined = providedSignal as AbortSignal | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  if (!signal) {
    controller = new AbortController();
    signal = controller.signal;
    timer = setTimeout(() => controller?.abort(), timeoutMs);
  }

  try {
    return await fetch(input as any, { ...rest, signal });
  } finally {
    if (timer) clearTimeout(timer);
  }
}