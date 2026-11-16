import fs from 'node:fs';
import path from 'node:path';
import { npmBin, npxBin, run } from './process-utils.mjs';

const root = process.cwd();
const withE2E = process.argv.includes('--e2e');

function parseNode(v) {
  const [major = 0, minor = 0] = v.replace(/^v/, '').split('.').map(Number);
  return { major, minor };
}

const current = parseNode(process.version);
if (current.major < 22 || (current.major === 22 && current.minor < 13)) {
  console.error(`Node ${process.version} is too old. Install Node >=22.13 (Node 24 LTS recommended).`);
  process.exit(1);
}

console.log(`\nProphet Research Engine v2.3 setup`);
console.log(`Node ${process.version} · ${process.platform}/${process.arch}`);
console.log('1/4 Installing workspace dependencies…');
run(npmBin, ['install', '--no-fund']);

console.log('2/4 Building core + API + React/Vite frontend…');
run(npmBin, ['run', 'build']);

console.log('3/4 Synchronizing SQLite read-model…');
run(npmBin, ['run', 'db:sync']);

if (withE2E) {
  console.log('4/4 Installing Playwright Chromium…');
  run(npxBin, ['playwright', 'install', 'chromium']);
} else {
  console.log('4/4 Skipping Playwright browser download (optional).');
}

const expected = [
  'apps/api/dist/server.js',
  'apps/web/dist/index.html',
  'data/sqlite/prophet-research-v2.3.sqlite',
];
for (const rel of expected) {
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) {
    console.error(`Setup incomplete: missing ${rel}`);
    process.exit(1);
  }
}

console.log('Running final doctor checks…');
run(npmBin, ['run', 'doctor']);

console.log('\nSETUP PASS');
console.log('Run: npm start');
console.log('Open: http://127.0.0.1:4310');
console.log('Verify without browser: npm run verify:handoff');
console.log('Full browser gate: npm run setup:e2e && npm run verify');
