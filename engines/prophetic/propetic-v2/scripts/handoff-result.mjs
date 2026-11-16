import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

export function sha256(file) {
  if (!fs.existsSync(file)) return null;
  return createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function npmVersion() {
  const bin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const out = spawnSync(bin, ['--version'], { encoding: 'utf8' });
  return out.status === 0 ? out.stdout.trim() : 'unknown';
}

export function writeHandoffResult(root, gates, extra = {}) {
  const outDir = path.join(root, 'handoff');
  fs.mkdirSync(outDir, { recursive: true });
  const healthPath = path.join(root, 'data/sqlite/prophet-research-v2.3.sqlite');
  const result = {
    release: '2.3.2',
    research_schema: '2.0',
    generated_at: new Date().toISOString(),
    environment: {
      node: process.version,
      npm: npmVersion(),
      platform: process.platform,
      arch: process.arch,
      hostname: os.hostname(),
    },
    gates,
    artifacts: {
      api_build: fs.existsSync(path.join(root, 'apps/api/dist/server.js')),
      web_build: fs.existsSync(path.join(root, 'apps/web/dist/index.html')),
      sqlite_db: fs.existsSync(healthPath),
      package_lock: fs.existsSync(path.join(root, 'package-lock.json')),
      playwright_report: fs.existsSync(path.join(root, 'playwright-report/index.html')),
    },
    checksums: {
      dataset_sha256: sha256(path.join(root, 'src/data/prophet-identity-graph.v2.0.json')),
      sqlite_sha256: sha256(healthPath),
      package_lock_sha256: sha256(path.join(root, 'package-lock.json')),
    },
    ...extra,
  };
  fs.writeFileSync(path.join(outDir, 'HANDOFF-RESULT.json'), JSON.stringify(result, null, 2) + '\n');
  const lines = [
    '# Handoff Result', '',
    `- Release: **${result.release}**`,
    `- Research schema: **${result.research_schema}**`,
    `- Generated: ${result.generated_at}`,
    `- Node: ${result.environment.node}`,
    `- npm: ${result.environment.npm}`,
    `- Platform: ${result.environment.platform}/${result.environment.arch}`,
    '', '## Gates', '',
    ...Object.entries(gates).map(([key, value]) => `- ${key}: **${value}**`),
    '', '## Return to ChatGPT', '',
    'Upload `handoff/HANDOFF-RESULT.json` together with any failing `playwright-report/` or terminal output.',
  ];
  fs.writeFileSync(path.join(outDir, 'HANDOFF-RESULT.md'), lines.join('\n') + '\n');
  return result;
}
