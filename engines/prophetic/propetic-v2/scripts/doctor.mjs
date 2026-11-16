import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const offline = process.argv.includes('--offline');
const checks = [];
const add = (name, ok, detail, required = true) => checks.push({ name, ok, detail, required });

function versionAtLeast(v, major, minor) {
  const parts = v.replace(/^v/, '').split('.').map(Number);
  return (parts[0] ?? 0) > major || ((parts[0] ?? 0) === major && (parts[1] ?? 0) >= minor);
}

add('Node >=22.13', versionAtLeast(process.version, 22, 13), process.version);
add('package.json', fs.existsSync(path.join(root, 'package.json')), 'root manifest');
add('node_modules', fs.existsSync(path.join(root, 'node_modules')), 'run npm run setup if missing', !offline);
add('API build', fs.existsSync(path.join(root, 'apps/api/dist/server.js')), 'apps/api/dist/server.js');
add('Web build', fs.existsSync(path.join(root, 'apps/web/dist/index.html')), 'apps/web/dist/index.html', !offline);
add('SQLite DB', fs.existsSync(path.join(root, 'data/sqlite/prophet-research-v2.3.sqlite')), 'derived read-model');
add('Research dataset', fs.existsSync(path.join(root, 'src/data/prophet-identity-graph.v2.0.json')), 'schema 2.0');
add('Playwright config', fs.existsSync(path.join(root, 'playwright.config.ts')), 'production E2E config');

if (fs.existsSync(path.join(root, 'apps/api/dist/db.js'))) {
  const probe = spawnSync(process.execPath, ['-e', `import('./apps/api/dist/db.js').then(m=>{const s=m.openStore(process.cwd());console.log(JSON.stringify(s.health()));s.db.close()})`], { cwd: root, encoding: 'utf8' });
  if (probe.status === 0) {
    try {
      const lines = probe.stdout.trim().split(/\r?\n/);
      const health = JSON.parse(lines.at(-1));
      add('SQLite health', health.ok === true && health.prophetCount === 25, `version ${health.version}, prophets ${health.prophetCount}`);
      add('DB schema', health.dbSchemaVersion === '2.3', String(health.dbSchemaVersion));
      add('Data schema', health.dataSchemaVersion === '2.0', String(health.dataSchemaVersion));
    } catch (error) {
      add('SQLite health', false, `unreadable output: ${error.message}`);
    }
  } else {
    add('SQLite health', false, probe.stderr.trim() || `exit ${probe.status}`);
  }
}

console.log(`\nProphet Research Engine · Doctor${offline ? ' (offline packaging mode)' : ''}\n`);
for (const c of checks) {
  const status = c.ok ? 'PASS' : c.required ? 'FAIL' : 'WARN';
  console.log(`${status}  ${c.name.padEnd(20)} ${c.detail}`);
}
const failed = checks.filter((c) => !c.ok && c.required);
const warnings = checks.filter((c) => !c.ok && !c.required);
console.log(`\n${checks.length - failed.length - warnings.length}/${checks.length} checks passed; ${warnings.length} warning(s).`);
if (failed.length) {
  console.log('Recommended: npm run setup');
  process.exitCode = 1;
}
