import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ui = path.join(root, 'ui');
const port = process.env.PORT || '8787';

function runProcess(cmd, args, cwd) {
  const child = spawn(cmd, args, { cwd, env: { ...process.env, PORT: port }, stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('error', err => console.error(`[DEV] Error running ${cmd}:`, err));
  return child;
}

async function main() {
  console.log('[DTV] Starting backend in watch mode (http://localhost:' + port + ')');
  const backend = runProcess('node', ['--watch', 'src/server.mjs'], root);

  console.log('[DTV] Starting React UI in dev mode (http://localhost:5173)');
  const frontend = runProcess(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'dev'], ui);

  const shutdown = () => {
    backend.kill('SIGTERM');
    frontend.kill('SIGTERM');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => { console.error(err); process.exit(1); });
