const DEFAULT_LOCAL_API_URL = 'http://localhost:8000/api/v1';
const DEFAULT_PRODUCTION_API_URL =
  'https://inventory-poos-v778d.ondigitalocean.app/api/v1';

function trimTrailingSlash(value: string): string {
  return value.trim().replace(/\/+$/, '');
}

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (fromEnv) {
    return trimTrailingSlash(fromEnv);
  }

  if (process.env.NODE_ENV === 'production') {
    return DEFAULT_PRODUCTION_API_URL;
  }

  return DEFAULT_LOCAL_API_URL;
}

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '') ||
  'https://inventory-pos-saas-rho.vercel.app';

export const API_BASE_URL = resolveApiBaseUrl();
