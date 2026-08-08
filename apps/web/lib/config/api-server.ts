import 'server-only';

function resolveServerApiUrl(): string {
  const configured =
    process.env.API_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!configured) {
    if (process.env.NODE_ENV !== 'production') return 'http://localhost:3001';
    throw new Error('API_URL is required in production');
  }

  const normalized = configured.replace(/\/$/, '');
  let url: URL;
  try {
    url = new URL(normalized);
  } catch {
    throw new Error('API_URL must be an absolute http(s) URL');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) {
    throw new Error('API_URL must be an http(s) URL without embedded credentials');
  }
  return normalized;
}

export const SERVER_API_URL = resolveServerApiUrl();
