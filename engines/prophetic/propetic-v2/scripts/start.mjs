import fs from 'node:fs';
import path from 'node:path';
import { npmBin, run, spawnForeground } from './process-utils.mjs';

const root = process.cwd();
const api = path.join(root, 'apps/api/dist/server.js');
const web = path.join(root, 'apps/web/dist/index.html');

if (!fs.existsSync(api) || !fs.existsSync(web)) {
  if (!fs.existsSync(path.join(root, 'node_modules'))) {
    console.error('Build artifacts/dependencies are missing. Run: npm run setup');
    process.exit(1);
  }
  console.log('Build artifacts missing; building automatically…');
  run(npmBin, ['run', 'build']);
  run(npmBin, ['run', 'db:sync']);
}

const port = process.env.PORT ?? '4310';
console.log(`Starting Prophet Research Engine v2.3 at http://127.0.0.1:${port}`);
const child = spawnForeground(process.execPath, ['apps/api/dist/server.js'], {
  env: { PROPHET_RESEARCH_ROOT: root, PORT: port },
});
child.on('exit', (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
