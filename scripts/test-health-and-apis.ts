/**
 * Health and core API smoke tests.
 * Run: npx ts-node scripts/test-health-and-apis.ts
 * Requires: backend server running (npm run dev). Set API_BASE_URL in .env.
 */
import { getApiBase } from './load-env';
import { runSuite, logSuite, ok, equal, getStats, resetStats, type TestResult } from './test-utils';

const BASE = getApiBase();

async function fetchJson(url: string, init?: RequestInit): Promise<{ status: number; data: any }> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers as Record<string, string>) },
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data };
}

async function main() {
  resetStats();
  const results: TestResult[] = [];

  const r1 = await runSuite('Health & APIs', [
    {
      name: 'GET /health returns 200 and status ok',
      fn: async () => {
        const { status, data } = await fetchJson(`${BASE}/health`);
        ok(status === 200, `expected 200, got ${status}`);
        ok(data?.status === 'ok' || data?.message?.includes('running'), 'health payload');
      },
    },
    {
      name: 'GET /api/v1/properties?sector=Sector 150 returns 200 and properties array',
      fn: async () => {
        const { status, data } = await fetchJson(`${BASE}/api/v1/properties?sector=Sector%20150`);
        ok(status === 200, `expected 200, got ${status}`);
        ok(Array.isArray(data?.properties), 'response must have properties array');
        const arr = data?.properties ?? [];
        if (arr.length > 0) {
          ok(typeof arr[0].id === 'string');
          ok(typeof arr[0].price === 'number' || typeof arr[0].price === 'string');
        }
      },
    },
    {
      name: 'GET /api/v1/properties without sector returns 400',
      fn: async () => {
        const { status } = await fetchJson(`${BASE}/api/v1/properties`);
        ok(status === 400, `expected 400, got ${status}`);
      },
    },
    {
      name: 'POST /api/v1/chat without X-User-Id (non-empty message) returns 400',
      fn: async () => {
        const { status } = await fetchJson(`${BASE}/api/v1/chat`, {
          method: 'POST',
          body: JSON.stringify({ message: 'hello' }),
        });
        ok(status === 400, `expected 400, got ${status}`);
      },
    },
    {
      name: 'POST /api/v1/chat without body message type returns 400',
      fn: async () => {
        const { status } = await fetchJson(`${BASE}/api/v1/chat`, {
          method: 'POST',
          body: JSON.stringify({}),
          headers: { 'X-User-Id': 'test-health-user' },
        });
        ok(status === 400, `expected 400, got ${status}`);
      },
    },
  ]);

  results.push(...r1);
  const success = logSuite('Health & APIs', r1);

  const stats = getStats();
  console.log(`\nTotal: ${stats.passed}/${stats.run} assertions passed.`);
  process.exit(success && stats.failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Failed to run health/API tests. Is the server running at', BASE, '?', e?.message ?? e);
  process.exit(1);
});
