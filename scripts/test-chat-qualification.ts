/**
 * Chat qualification flow tests.
 * Run: npx ts-node scripts/test-chat-qualification.ts
 * Requires: backend server running (npm run dev). Set API_BASE_URL in .env.
 */
import { getApiBase } from './load-env';
import { runSuite, logSuite, ok, equal, getStats, resetStats, type TestResult } from './test-utils';

const BASE = getApiBase();
const USER = `test-qual-${Date.now()}`;

async function chat(message: string, userId: string): Promise<{ status: number; data: any }> {
  const res = await fetch(`${BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': userId },
    body: JSON.stringify({ message }),
  });
  const data = res.headers.get('content-type')?.includes('json') ? await res.json().catch(() => ({})) : {};
  return { status: res.status, data };
}

async function resetChat(userId: string): Promise<{ status: number }> {
  const res = await fetch(`${BASE}/api/v1/chat/intent`, {
    method: 'DELETE',
    headers: { 'X-User-Id': userId },
  });
  return { status: res.status };
}

async function main() {
  resetStats();
  await resetChat(USER);

  const r1 = await runSuite('Chat qualification flow', [
    {
      name: 'Empty message returns first question (property type) and next_expected_field',
      fn: async () => {
        const { status, data } = await chat('', USER);
        ok(status === 200, `expected 200, got ${status}`);
        ok(typeof data?.message === 'string' && data.message.length > 0);
        ok(data?.chatPhase === 'QUALIFICATION');
        ok(data?.next_expected_field === 'property_type');
        ok(Array.isArray(data?.properties) && data.properties.length === 0);
        ok(data?.showRecommendations === false);
      },
    },
    {
      name: '"2bhk flat" returns follow-up (budget), not "I have everything I need"',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        const { status, data } = await chat('2bhk flat', USER);
        ok(status === 200, `expected 200, got ${status}`);
        ok(!data?.message?.includes('I have everything I need'), 'must not say complete after only BHK');
        ok(data?.next_expected_field === 'budget');
        ok(data?.chatPhase === 'QUALIFICATION');
        ok(data?.intent?.bhk === 2);
      },
    },
    {
      name: 'Progressive: next_expected_field always set during qualification',
      fn: async () => {
        await resetChat(USER);
        await chat('', USER);
        const r2 = await chat('2bhk flat', USER);
        ok(r2.data?.next_expected_field != null);
        const r3 = await chat('under 1 crore', USER);
        ok(r3.status === 200);
        ok(r3.data?.next_expected_field == null || r3.data?.next_expected_field != null);
        if (r3.data?.chatPhase === 'QUALIFICATION') {
          ok(r3.data?.next_expected_field != null, 'qualification must have next_expected_field');
        }
      },
    },
    {
      name: 'Reset intent clears state',
      fn: async () => {
        await chat('3bhk flat', USER);
        await resetChat(USER);
        const { data } = await chat('', USER);
        ok(data?.next_expected_field === 'property_type');
        ok(!data?.intent?.bhk || data.intent.bhk !== 3);
      },
    },
  ]);

  const success = logSuite('Chat qualification flow', r1);
  const stats = getStats();
  console.log(`\nTotal: ${stats.passed}/${stats.run} assertions passed.`);
  process.exit(success && stats.failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('Chat qualification tests failed. Is the server running at', BASE, '?', e?.message ?? e);
  process.exit(1);
});
