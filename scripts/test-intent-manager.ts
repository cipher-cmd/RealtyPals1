/**
 * Unit tests for intent manager.
 * Run: npx ts-node scripts/test-intent-manager.ts
 * No server required.
 */

import {
  mergeIntentState,
  getNextQuestion,
  isIntentComplete,
  calculateCompletenessScore,
  intentToDiscoveryInput,
  type IntentState,
} from '../src/services/intentManager';
import { runSuite, logSuite, ok, equal, resetStats, getStats, type TestResult } from './test-utils';

const empty: IntentState = { completenessScore: 0 };

async function main() {
  resetStats();
  const allResults: TestResult[] = [];

  const r1 = await runSuite('Intent Manager', [
    {
      name: 'getNextQuestion asks property type when empty',
      fn: () => {
        const q = getNextQuestion(empty);
        ok(q.field === 'property_type');
        ok(q.question.toLowerCase().includes('type'));
        ok(!q.question.includes('I have everything I need'));
      },
    },
    {
      name: 'getNextQuestion asks BHK after property type',
      fn: () => {
        const intent = mergeIntentState(empty, { property_type: 'flat' });
        const q = getNextQuestion(intent);
        ok(q.field === 'bhk');
        ok(q.question.includes('bedroom') || q.question.includes('BHK'));
      },
    },
    {
      name: 'getNextQuestion asks budget after BHK',
      fn: () => {
        const intent = mergeIntentState(empty, { property_type: 'flat', bhk: 2 });
        const q = getNextQuestion(intent);
        ok(q.field === 'budget');
        ok(q.question.toLowerCase().includes('budget'));
      },
    },
    {
      name: 'getNextQuestion asks purpose after budget',
      fn: () => {
        const intent = mergeIntentState(empty, {
          property_type: 'flat',
          bhk: 2,
          budget: { min: 50_00_000, max: 1_00_00_000, flexibility: 'unknown' },
        });
        const q = getNextQuestion(intent);
        ok(q.field === 'purpose');
        ok(q.question.toLowerCase().includes('end-use') || q.question.toLowerCase().includes('investment'));
      },
    },
    {
      name: 'getNextQuestion asks timeline after purpose',
      fn: () => {
        const base = mergeIntentState(empty, {
          property_type: 'flat',
          bhk: 2,
          budget: { min: 50_00_000, max: 1_00_00_000, flexibility: 'unknown' },
          purpose: 'end_use',
        });
        const q = getNextQuestion(base);
        ok(q.field === 'timeline');
        ok(q.question.toLowerCase().includes('move') || q.question.toLowerCase().includes('timeline'));
      },
    },
    {
      name: 'getNextQuestion asks status after timeline',
      fn: () => {
        const base = mergeIntentState(empty, {
          property_type: 'flat',
          bhk: 2,
          budget: { min: 50_00_000, max: 1_00_00_000, flexibility: 'unknown' },
          purpose: 'end_use',
          timeline: 'immediate',
        });
        const q = getNextQuestion(base);
        ok(q.field === 'status');
        ok(
          q.question.toLowerCase().includes('ready') ||
            q.question.toLowerCase().includes('under-construction') ||
            q.question.toLowerCase().includes('construction')
        );
      },
    },
    {
      name: 'getNextQuestion returns complete when all resolved',
      fn: () => {
        const base = mergeIntentState(empty, {
          property_type: 'flat',
          bhk: 2,
          budget: { min: 50_00_000, max: 1_00_00_000, flexibility: 'unknown' },
          purpose: 'end_use',
          timeline: 'immediate',
          preferences: { ready_to_move: true, under_construction: false },
        });
        const q = getNextQuestion(base);
        ok(q.question.includes('I have everything I need'));
        ok(q.field === undefined);
      },
    },
    {
      name: 'mergeIntentState sets BHK and recomputes resolvedFields',
      fn: () => {
        const merged = mergeIntentState(empty, { bhk: 3 });
        ok(merged.bhk === 3);
        ok(merged.resolvedFields?.bhk === true);
        ok(typeof merged.completenessScore === 'number');
      },
    },
    {
      name: 'mergeIntentState preserves sector without forcing city',
      fn: () => {
        const merged = mergeIntentState(empty, { sector: 'Sector 150' });
        equal(merged.sector, 'Sector 150');
        ok(merged.resolvedFields?.sector === true);
      },
    },
    {
      name: 'recomputeResolvedFields: only actual values (no stale)',
      fn: () => {
        const withStale: IntentState = {
          ...empty,
          resolvedFields: { bhk: true, budget: true, purpose: true, timeline: true, status: true },
          completenessScore: 100,
        };
        const updates = { bhk: 2 };
        const merged = mergeIntentState(withStale, updates);
        ok(merged.resolvedFields?.bhk === true);
        ok(merged.resolvedFields?.budget !== true);
        ok(merged.resolvedFields?.purpose !== true);
        ok(merged.completenessScore < 100);
      },
    },
    {
      name: 'isIntentComplete false when score < 60',
      fn: () => {
        const low = mergeIntentState(empty, { bhk: 2 });
        ok(!isIntentComplete(low));
      },
    },
    {
      name: 'isIntentComplete true when enough fields',
      fn: () => {
        const full = mergeIntentState(empty, {
          bhk: 2,
          budget: { min: 50_00_000, max: 1_00_00_000, flexibility: 'unknown' },
          purpose: 'end_use',
          timeline: 'immediate',
          preferences: { ready_to_move: true },
        });
        ok(full.completenessScore >= 60);
        ok(isIntentComplete(full));
      },
    },
    {
      name: 'intentToDiscoveryInput maps correctly',
      fn: () => {
        const intent = mergeIntentState(empty, {
          bhk: 3,
          budget: { min: 50_00_000, max: 1_00_00_000, flexibility: 'unknown' },
        });
        const input = intentToDiscoveryInput(intent, 'Sector 150', 'flat');
        equal(input.sector, 'Sector 150');
        equal(input.bhk, 3);
        equal(input.min_price, 50_00_000);
        equal(input.max_price, 1_00_00_000);
        equal(input.property_type, 'flat');
      },
    },
    {
      name: 'calculateCompletenessScore increases with more fields',
      fn: () => {
        const s0 = calculateCompletenessScore(empty);
        const s1 = calculateCompletenessScore(mergeIntentState(empty, { bhk: 2 }));
        const s2 = calculateCompletenessScore(
          mergeIntentState(empty, {
            bhk: 2,
            budget: { max: 1_00_00_000, flexibility: 'unknown' },
          })
        );
        ok(s1 > s0);
        ok(s2 > s1);
        ok(s2 <= 100);
      },
    },
  ]);

  allResults.push(...r1);
  const success = logSuite('Intent Manager', r1);

  const stats = getStats();
  console.log(`\nTotal: ${stats.passed}/${stats.run} assertions passed.`);
  process.exit(success && stats.failed === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
