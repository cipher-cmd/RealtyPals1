/**
 * Run all test scripts in order.
 * Run: npx ts-node scripts/run-all-tests.ts
 *
 * 1. test-intent-manager.ts (unit, no server)
 * 2. test-health-and-apis.ts (requires server)
 * 3. test-chat-qualification.ts (requires server)
 * 4. test-chat-progressive.ts (requires server)
 * 5. test-chat-requalify-3bhk.ts (requires server; run after restarting backend)
 *
 * Load .env from project root. Set API_BASE_URL in .env for API tests.
 * If server is not running, API tests will fail. Start with: npm run dev.
 */

import { spawn } from 'child_process';
import * as path from 'path';
import * as dotenv from 'dotenv';

const ROOT = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(ROOT, '.env') });
const SCRIPTS = [
  'scripts/test-intent-manager.ts',
  'scripts/test-health-and-apis.ts',
  'scripts/test-chat-qualification.ts',
  'scripts/test-chat-progressive.ts',
  'scripts/test-chat-requalify-3bhk.ts',
];

function run(script: string): Promise<{ ok: boolean; code: number | null; stderr: string }> {
  return new Promise((resolve) => {
    const cp = spawn('npx', ['ts-node', script], {
      cwd: ROOT,
      stdio: ['ignore', 'inherit', 'pipe'],
      shell: true,
    });
    let stderr = '';
    cp.stderr?.on('data', (d) => {
      stderr += String(d);
    });
    cp.on('close', (code) => {
      resolve({ ok: code === 0, code, stderr });
    });
  });
}

async function main() {
  console.log('Run all tests\n' + '='.repeat(50));

  let failed = 0;
  for (const script of SCRIPTS) {
    const name = path.basename(script, '.ts');
    process.stdout.write(`\n>>> ${name} ... `);
    const { ok, code, stderr } = await run(script);
    if (ok) {
      console.log('OK');
    } else {
      console.log(`FAILED (exit ${code})`);
      if (stderr) console.error(stderr);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  if (failed === 0) {
    console.log(`All ${SCRIPTS.length} test script(s) passed.`);
    process.exit(0);
  } else {
    console.log(`${failed}/${SCRIPTS.length} script(s) failed.`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
