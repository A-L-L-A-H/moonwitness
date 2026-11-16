import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ui = path.join(root, 'ui');
const uiNodeModules = path.join(ui, 'node_modules');
const uiDist = path.join(ui, 'dist');
const noInstall = process.argv.includes('--no-install');
const port = process.env.PORT || '8787';

function run(cmd, args, cwd, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd, env: { ...process.env, ...extraEnv }, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${cmd} exited with ${code}`)));
  });
}

async function main() {
  let reactReady = existsSync(path.join(uiNodeModules, '.bin', 'vite')) && existsSync(uiDist);
  if (!reactReady && !noInstall) {
    console.log('[DTV] Installing UI dependencies…');
    try {
      await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], ui);
      await run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build'], ui);
      reactReady = true;
    } catch (err) {
      console.warn('[DTV] React/Vite install or build unavailable. Falling back to bundled local UI.');
      console.warn(`[DTV] ${err.message}`);
    }
  }
  if (!reactReady) console.log('[DTV] Starting bundled fallback UI at http://localhost:' + port);
  else console.log('[DTV] Starting built React UI through the local Node server at http://localhost:' + port);
  const server = spawn(process.execPath, ['src/server.mjs'], { cwd: root, env: { ...process.env, PORT: port }, stdio: 'inherit' });
  const shutdown = () => server.kill('SIGTERM');
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
  server.on('exit', code => process.exit(code ?? 0));
}
main().catch(err => { console.error(err); process.exit(1); });
