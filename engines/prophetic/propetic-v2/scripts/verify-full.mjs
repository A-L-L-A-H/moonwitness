import { npmBin, run } from './process-utils.mjs';
import { writeHandoffResult } from './handoff-result.mjs';

const root = process.cwd();
const gates = {
  mode: 'FULL_DEPENDENCY_BROWSER_E2E',
  core_api_sqlite: 'NOT_RUN',
  react_typecheck: 'NOT_RUN',
  vite_build: 'NOT_RUN',
  browser_e2e: 'NOT_RUN',
  doctor: 'NOT_RUN',
};
let stage = null;
function failRunningGate() { if (stage && gates[stage] === 'RUNNING') gates[stage] = 'FAIL'; }

try {
  stage = 'core_api_sqlite'; gates[stage] = 'RUNNING';
  run(npmBin, ['run', 'test']);
  gates.core_api_sqlite = 'PASS';
  gates.react_typecheck = 'PASS';

  stage = 'vite_build'; gates[stage] = 'RUNNING';
  run(npmBin, ['run', 'web:build']);
  gates.vite_build = 'PASS';

  stage = 'browser_e2e'; gates[stage] = 'RUNNING';
  run(npmBin, ['run', 'e2e']);
  gates.browser_e2e = 'PASS';

  stage = 'doctor'; gates[stage] = 'RUNNING';
  run(npmBin, ['run', 'doctor']);
  gates.doctor = 'PASS';
  stage = null;

  writeHandoffResult(root, gates);
  console.log('\nFULL VERIFY PASS');
  console.log('Return file: handoff/HANDOFF-RESULT.json');
} catch (error) {
  failRunningGate();
  writeHandoffResult(root, gates, { failed_stage: stage, error: String(error?.message ?? error) });
  console.error('\nFULL VERIFY FAILED');
  console.error(`Failed stage: ${stage ?? 'unknown'}`);
  console.error('See terminal output and handoff/HANDOFF-RESULT.json');
  process.exit(1);
}
