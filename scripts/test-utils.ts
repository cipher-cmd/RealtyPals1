/**
 * Minimal test helpers for standalone test scripts.
 * No Jest dependency.
 */

export type TestFn = () => void | Promise<void>;

export interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  durationMs?: number;
}

let totalRun = 0;
let totalPassed = 0;
let totalFailed = 0;

export function ok(cond: boolean, msg?: string): void {
  totalRun++;
  if (cond) {
    totalPassed++;
    return;
  }
  totalFailed++;
  const m = msg ?? 'Assertion failed';
  throw new Error(m);
}

export function equal<T>(a: T, b: T, msg?: string): void {
  totalRun++;
  if (a === b) {
    totalPassed++;
    return;
  }
  totalFailed++;
  const m = msg ?? `Expected ${JSON.stringify(a)} === ${JSON.stringify(b)}`;
  throw new Error(m);
}

export function deepEqual(a: unknown, b: unknown, msg?: string): void {
  totalRun++;
  const sa = JSON.stringify(a);
  const sb = JSON.stringify(b);
  if (sa === sb) {
    totalPassed++;
    return;
  }
  totalFailed++;
  const m = msg ?? `Expected deep equal:\n  ${sa}\n  ${sb}`;
  throw new Error(m);
}

export function throws(fn: () => void, msg?: string): void {
  totalRun++;
  try {
    fn();
  } catch {
    totalPassed++;
    return;
  }
  totalFailed++;
  const m = msg ?? 'Expected function to throw';
  throw new Error(m);
}

export function getStats(): { run: number; passed: number; failed: number } {
  return { run: totalRun, passed: totalPassed, failed: totalFailed };
}

export function resetStats(): void {
  totalRun = 0;
  totalPassed = 0;
  totalFailed = 0;
}

export async function runSuite(
  name: string,
  tests: Array<{ name: string; fn: TestFn }>
): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const t of tests) {
    const start = Date.now();
    try {
      await t.fn();
      results.push({
        name: t.name,
        passed: true,
        durationMs: Date.now() - start,
      });
    } catch (e: any) {
      results.push({
        name: t.name,
        passed: false,
        error: e?.message ?? String(e),
        durationMs: Date.now() - start,
      });
    }
  }
  return results;
}

export function logSuite(name: string, results: TestResult[]): boolean {
  const failed = results.filter((r) => !r.passed);
  console.log(`\n${name}`);
  console.log('-'.repeat(50));
  for (const r of results) {
    const icon = r.passed ? '✓' : '✗';
    const tail = r.passed ? (r.durationMs != null ? ` ${r.durationMs}ms` : '') : ` ${r.error}`;
    console.log(`  ${icon} ${r.name}${tail}`);
  }
  if (failed.length > 0) {
    console.log(`  Failed: ${failed.length}/${results.length}`);
    return false;
  }
  console.log(`  All ${results.length} passed.`);
  return true;
}
