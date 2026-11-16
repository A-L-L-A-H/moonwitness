import { spawnSync, spawn } from 'node:child_process';

export const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';
export const npxBin = process.platform === 'win32' ? 'npx.cmd' : 'npx';

export function run(command, args = [], options = {}) {
  const isWindows = process.platform === 'win32';
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: 'inherit',
    shell: isWindows,
  });
  if (result.error) throw result.error;
  if ((result.status ?? 1) !== 0) {
    const error = new Error(`${command} ${args.join(' ')} failed with exit code ${result.status}`);
    error.exitCode = result.status ?? 1;
    throw error;
  }
}

export function spawnForeground(command, args = [], options = {}) {
  const isWindows = process.platform === 'win32';
  return spawn(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: { ...process.env, ...(options.env ?? {}) },
    stdio: 'inherit',
    shell: isWindows,
  });
}
