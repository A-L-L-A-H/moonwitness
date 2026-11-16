import fs from 'node:fs';
import path from 'node:path';
import { npmBin, run } from './process-utils.mjs';
import { writeHandoffResult } from './handoff-result.mjs';

const root = process.cwd();
const hasNodeModules = fs.existsSync(path.join(root, 'node_modules'));
const gates = {
  mode: hasNodeModules ? 'DEPENDENCY_RESOLVED_NO_BROWSER' : 'OFFLINE_CORE_API',
  core_api_sqlite: 'NOT_RUN',
  react_typecheck: hasNodeModules ? 'NOT_RUN' : 'NOT_AVAILABLE',
  vite_build: hasNodeModules ? 'NOT_RUN' : 'NOT_AVAILABLE',
  browser_e2e: 'NOT_RUN',
  doctor: 'NOT_RUN',
};
let stage = null;
function failRunningGate() { if (stage && gates[stage] === 'RUNNING') gates[stage] = 'FAIL'; }

try {
  console.log('Prophet Research Engine v2.3 · Handoff verification');
  stage = 'core_api_sqlite'; gates[stage] = 'RUNNING';
  if (hasNodeModules) {
    run(npmBin, ['run', 'test']);
    gates.core_api_sqlite = 'PASS';
    gates.react_typecheck = 'PASS';
    stage = 'vite_build'; gates[stage] = 'RUNNING';
    run(npmBin, ['run', 'web:build']);
    gates.vite_build = 'PASS';
  } else {
    run(npmBin, ['run', 'test:offline']);
    gates.core_api_sqlite = 'PASS';
  }
  stage = 'doctor'; gates[stage] = 'RUNNING';
  if (hasNodeModules) run(npmBin, ['run', 'doctor']);
  else run(process.execPath, ['scripts/doctor.mjs', '--offline']);
  gates.doctor = 'PASS';
  stage = null;
  writeHandoffResult(root, gates);
  console.log('\nHANDOFF VERIFY PASS');
  console.log('Result: handoff/HANDOFF-RESULT.json');
  console.log(hasNodeModules ? 'Full browser gate: npm run verify' : 'Install first for full browser gate: npm run setup:e2e && npm run verify');
} catch (error) {
  failRunningGate();
  writeHandoffResult(root, gates, { failed_stage: stage, error: String(error?.message ?? error) });
  console.error('\nHANDOFF VERIFY FAILED');
  console.error(`Failed stage: ${stage ?? 'unknown'}`);
  console.error(error);
  process.exit(1);
}
