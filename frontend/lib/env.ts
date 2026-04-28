/**
 * Environment-derived config. No hardcoded URLs.
 * Set NEXT_PUBLIC_API_URL in .env.local (see .env.example).
 */

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL;
  if (!base || !base.startsWith('http')) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is required. Set it in .env.local (e.g. NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1).'
    );
  }
  return base.replace(/\/$/, '');
}

export const API_BASE = getApiBase();
