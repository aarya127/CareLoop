function resolvePublicApiUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001';
    throw new Error('NEXT_PUBLIC_API_URL is required in production');
  }

  const normalized = configured.replace(/\/$/, '');
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error('NEXT_PUBLIC_API_URL must be an absolute http(s) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_API_URL must be an http(s) URL without embedded credentials');
  }
  return normalized;
}

export const PUBLIC_API_URL = resolvePublicApiUrl();

function resolvePublicWebSocketUrl(): string {
  const configured = process.env.NEXT_PUBLIC_WS_BASE_URL;
  if (!configured) return PUBLIC_API_URL.replace(/^http/, 'ws');
  const normalized = configured.replace(/\/$/, '');
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error('NEXT_PUBLIC_WS_BASE_URL must be an absolute ws(s) URL');
  }
  if (!['ws:', 'wss:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('NEXT_PUBLIC_WS_BASE_URL must be a ws(s) URL without embedded credentials');
  }
  return normalized;
}

export const PUBLIC_WS_URL = resolvePublicWebSocketUrl();
