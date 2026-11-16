import { spawn } from 'node:child_process';

const url = `http://127.0.0.1:${process.env.PORT ?? '4310'}`;
const healthUrl = `${url}/api/v2/health`;
const child = spawn(process.execPath, ['scripts/start.mjs'], { cwd: process.cwd(), env: process.env, stdio: 'inherit' });

let stopping = false;
function stop(signal = 'SIGTERM') {
  if (stopping) return;
  stopping = true;
  try { child.kill(signal); } catch {}
}
process.on('SIGINT', () => stop('SIGINT'));
process.on('SIGTERM', () => stop('SIGTERM'));
child.on('exit', (code) => process.exit(code ?? 0));

async function waitForHealth() {
  for (let i = 0; i < 120; i++) {
    if (child.exitCode !== null) return false;
    try {
      const response = await fetch(healthUrl);
      if (response.ok) return true;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function openBrowser(target) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', target], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [target], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [target], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch {
    console.log(`Open manually: ${target}`);
  }
}

if (await waitForHealth()) {
  console.log(`UI ready: ${url}`);
  openBrowser(url);
} else {
  console.error(`Server did not become healthy: ${healthUrl}`);
  stop();
}
