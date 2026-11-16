import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ui = path.join(root, 'ui');
const outDir = path.join(root, 'outputs', 'handoff');
mkdirSync(outDir, { recursive: true });
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(label, cwd, args) {
  const r = spawnSync(npmCmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
  return { label, code: r.status ?? 1 };
}

const results = [];
results.push(run('root-tests', root, ['test']));
results.push(run('ui-install', ui, ['install', '--no-audit', '--no-fund']));
results.push(run('ui-build', ui, ['run', 'build']));
results.push(run('local-e2e', root, ['run', 'e2e']));

const report = {
  generated_at: new Date().toISOString(),
  node: process.version,
  platform: process.platform,
  ui_dist_present: existsSync(path.join(ui, 'dist')),
  results,
  success: results.every(x => x.code === 0 && x.code !== null)
};

writeFileSync(path.join(outDir, 'INSTALL_E2E_REPORT.json'), JSON.stringify(report, null, 2));
console.log('\n[DTV] HANDOFF REPORT: ' + (report.success ? 'PASS' : 'REVIEW REQUIRED'));
console.log('[DTV] Saved: outputs/handoff/INSTALL_E2E_REPORT.json');
process.exit(report.success ? 0 : 1);
