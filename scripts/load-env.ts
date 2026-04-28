/**
 * Load .env from project root and ensure required vars for API tests.
 * Use from test scripts: import './load-env'; then use getApiBase().
 */
import * as path from 'path';
import * as dotenv from 'dotenv';

const root = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(root, '.env') });

export function getApiBase(): string {
  const base = process.env.API_BASE_URL;
  if (!base || !base.startsWith('http')) {
    console.error(
      'API_BASE_URL is required for API tests. Set it in .env (e.g. API_BASE_URL=http://localhost:3000).'
    );
    process.exit(1);
  }
  return base.replace(/\/$/, '');
}
