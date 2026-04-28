/**
 * Re-qualify flow: 3 BHK results -> "2bhk flat" -> expect updated intent, no stale 3 BHK.
 * Uses 3 BHK first (seed has 3 BHK ready) then re-qualify to 2 BHK.
 * Run: npx ts-node scripts/test-chat-requalify-3bhk.ts
 * Requires: backend server running (npm run dev). Set API_BASE_URL in .env.
 */
import { getApiBase } from './load-env';
import { runSuite, logSuite, ok, getStats, resetStats, type TestResult } from './test-utils';

const BASE = getApiBase();
const USER = `test-requalify-${Date.now()}`;

async function chat(message: string, userId: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({ message }),
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data };
}

async function resetChat(userId: string): Promise<void> {
  await fetch(`${BASE}/api/v1/chat/intent`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
}

async function main() {
  resetStats();
  await resetChat(USER);

  const r1 = await runSuite('Re-qualify 2 BHK after 3 BHK', [
    {
      name: '"2bhk flat under 1 crore" after 3 BHK results: no stale 3 BHK, no advisor intro',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        await chat('3bhk flat', USER);
        await chat('under 2 crore', USER);
        await chat('investment', USER);
        await chat('immediate', USER);
        await chat('ready to move', USER);

        const r = await chat('2bhk flat under 1 crore', USER);
        ok(r.status === 200);

        const hasStale3Bhk = Array.isArray(r.data?.properties) && r.data.properties.some((p: any) => p.bhk === 3);
        ok(!hasStale3Bhk, 'must not show 3 BHK properties after "2bhk flat under 1 crore"');

        const staleMsg = r.data?.message?.includes('I can help you with') && r.data?.message?.includes('shortlisted');
        ok(!staleMsg, 'must not show advisor intro when re-qualifying');

        if (r.data?.intent?.bhk != null) {
          ok(r.data.intent.bhk === 2, 'intent should update to 2 BHK when provided');
        }
      },
    },
    {
      name: 'Re-qualify: either new results match BHK or next question',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        await chat('3bhk flat', USER);
        await chat('under 2 crore', USER);
        await chat('investment', USER);
        await chat('immediate', USER);
        await chat('ready to move', USER);

        const r = await chat('2bhk flat under 1 crore', USER);
        ok(r.status === 200);

        if (r.data?.showRecommendations && r.data?.properties?.length > 0) {
          const all2 = r.data.properties.every((p: any) => p.bhk === 2);
          ok(all2, 'if showing results, all must be 2 BHK');
        } else {
          ok(r.data?.chatPhase === 'QUALIFICATION');
          ok(r.data?.next_expected_field != null);
        }
      },
    },
  ]);

  const success = logSuite('Re-qualify 2 BHK after 3 BHK', r1);
  const stats = getStats();
  console.log(`\nTotal: ${stats.passed}/${stats.run} assertions passed.`);
  process.exit(success && stats.failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Re-qualify tests failed. Is the server running at', BASE, '?', e?.message ?? e);
  process.exit(1);
});
