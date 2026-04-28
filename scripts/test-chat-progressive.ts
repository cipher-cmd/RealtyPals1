/**
 * Progressive chat flow: follow-up questions, next_expected_field, no premature "I have everything".
 * Run: npx ts-node scripts/test-chat-progressive.ts
 * Requires: backend server running (npm run dev). Set API_BASE_URL in .env.
 */
import { getApiBase } from './load-env';
import { runSuite, logSuite, ok, getStats, resetStats, type TestResult } from './test-utils';

const BASE = getApiBase();
const USER = `test-progressive-${Date.now()}`;

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

  const r1 = await runSuite('Progressive chat flow', [
    {
      name: '2bhk flat -> budget question, next_expected_field=budget',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        const r = await chat('2bhk flat', USER);
        ok(r.status === 200);
        ok(r.data?.next_expected_field === 'budget');
        ok(!r.data?.message?.includes('I have everything I need'));
      },
    },
    {
      name: '3bhk -> budget question',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        const r = await chat('3bhk flat', USER);
        ok(r.status === 200);
        ok(r.data?.next_expected_field === 'budget');
        ok(r.data?.intent?.bhk === 3);
      },
    },
    {
      name: 'Type -> BHK -> budget -> purpose -> timeline -> status order',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        let r = await chat('flat', USER);
        ok(r.data?.next_expected_field === 'bhk');

        r = await chat('4 bhk', USER);
        ok(r.data?.next_expected_field === 'budget');

        r = await chat('under 1.5 crore', USER);
        ok(r.status === 200);
        if (r.data?.chatPhase === 'QUALIFICATION' && r.data?.next_expected_field) {
          ok(
            ['purpose', 'timeline', 'status'].includes(r.data.next_expected_field),
            'next should be purpose/timeline/status'
          );
        }

        r = await chat('investment', USER);
        ok(r.status === 200);
        if (r.data?.chatPhase === 'QUALIFICATION' && r.data?.next_expected_field) {
          ok(
            ['timeline', 'status'].includes(r.data.next_expected_field),
            'next should be timeline or status'
          );
        }
      },
    },
    {
      name: 'Timeline preset "3 months" progresses flow',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        await chat('flat', USER);
        await chat('2 bhk', USER);
        await chat('under 1 crore', USER);
        const r = await chat('investment', USER);
        ok(r.status === 200);
        const r2 = await chat('3 months', USER);
        ok(r2.status === 200);
        ok(
          r2.data?.chatPhase === 'QUALIFICATION' || r2.data?.chatPhase === 'ADVISOR',
          'phase must be QUALIFICATION or ADVISOR'
        );
      },
    },
    {
      name: 'No duplicate "I have everything I need" in reply',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        const r = await chat('2bhk flat', USER);
        const msg = r.data?.message ?? '';
        const count = (msg.match(/I have everything I need/g) || []).length;
        ok(count <= 1, 'must not duplicate "I have everything I need"');
      },
    },
  ]);

  const success = logSuite('Progressive chat flow', r1);
  const stats = getStats();
  console.log(`\nTotal: ${stats.passed}/${stats.run} assertions passed.`);
  process.exit(success && stats.failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Progressive flow tests failed. Is the server running at', BASE, '?', e?.message ?? e);
  process.exit(1);
});
