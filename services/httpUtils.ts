// Helper for fetch with a robust timeout using AbortController
import { Platform } from 'react-native';
// Ensures that in environments where AbortSignal.timeout is not available,
// requests will still be aborted after the specified timeout to avoid hanging UI.
export async function fetchWithTimeout(
  input: RequestInfo,
  init: (RequestInit & { timeoutMs?: number }) = {}
): Promise<Response> {
  const { timeoutMs = 30000, signal: providedSignal, ...rest } = init as any;
  // Ensure no custom Accept header is sent on web para evitar preflight; en nativo lo conservamos
  if (Platform.OS === 'web' && rest && rest.headers) {
    const headersObj: Record<string, any> = rest.headers as any;
    if (headersObj.Accept || headersObj.accept) {
      delete headersObj.Accept;
      delete headersObj.accept;
      if (Object.keys(headersObj).length === 0) {
        delete rest.headers;
      }
    }
  }

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