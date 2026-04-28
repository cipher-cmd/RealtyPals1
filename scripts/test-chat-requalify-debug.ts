/**
 * Debug script: run requalify flow and log full API responses.
 * Run: npx ts-node scripts/test-chat-requalify-debug.ts
 * Requires: server running. Set API_BASE_URL in .env.
 */
import { getApiBase } from './load-env';

const BASE = getApiBase();
const USER = `test-requalify-debug-${Date.now()}`;

async function chat(message: string): Promise<any> {
  const res = await fetch(`${BASE}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-User-Id': USER },
    body: JSON.stringify({ message }),
  });
  return res.json();
}

async function reset() {
  await fetch(`${BASE}/api/v1/chat/intent`, { method: 'DELETE', headers: { 'X-User-Id': USER } });
}

async function main() {
  await reset();
  await chat('');

  await chat('3bhk flat');
  await chat('under 2 crore');
  await chat('investment');
  await chat('immediate');
  const rReady = await chat('ready to move');
  console.log('\n--- After "ready to move" ---');
  console.log('chatPhase:', rReady.chatPhase);
  console.log('showRecommendations:', rReady.showRecommendations);
  console.log('properties length:', rReady.properties?.length);
  console.log('bhks:', rReady.properties?.map((p: any) => p.bhk));

  const r2 = await chat('2bhk flat under 1 crore');
  console.log('\n--- After "2bhk flat under 1 crore" ---');
  console.log('chatPhase:', r2.chatPhase);
  console.log('showRecommendations:', r2.showRecommendations);
  console.log('properties length:', r2.properties?.length);
  console.log('bhks:', r2.properties?.map((p: any) => p.bhk));
  console.log('intent.bhk:', r2.intent?.bhk);
  console.log('message snippet:', (r2.message || '').slice(0, 120));
}

main().catch((e) => console.error(e));
