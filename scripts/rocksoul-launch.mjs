#!/usr/bin/env node
/**
 * Launch ROCKSOUL desktop (Tauri dev) from the monorepo root.
 * If Vite is already serving 127.0.0.1:1420 (e.g. via `pnpm dev`),
 * skip `beforeDevCommand` so Tauri attaches cleanly without a port clash.
 */

import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import net from "node:net";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "..");
const ROCKSOUL_PORT = 1420;

function isPortListening(host, port, timeoutMs = 250) {
  return new Promise((resolvePromise) => {
    const socket = net.createConnection({ host, port });
    const settle = (listening) => {
      socket.removeAllListeners();
      socket.destroy();
      resolvePromise(listening);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => settle(true));
    socket.once("timeout", () => settle(false));
    socket.once("error", () => settle(false));
  });
}

async function main() {
  const alreadyServing = await isPortListening("127.0.0.1", ROCKSOUL_PORT);
  const args = ["--filter", "rocksoul-dx", "exec", "tauri", "dev", ...process.argv.slice(2)];
  let tempDir = null;

  if (alreadyServing) {
    tempDir = mkdtempSync(join(tmpdir(), "rocksoul-tauri-"));
    const overrideConfigPath = join(tempDir, "tauri.attach.json");
    writeFileSync(overrideConfigPath, JSON.stringify({ build: { beforeDevCommand: "" } }));
    args.push("--config", overrideConfigPath);
    console.log(`[rocksoul] attaching to running dev server on 127.0.0.1:${ROCKSOUL_PORT}`);
  }

  const child =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/c", "pnpm.cmd", ...args], { cwd: ROOT, stdio: "inherit" })
      : spawn("pnpm", args, { cwd: ROOT, stdio: "inherit" });

  const cleanupTemp = () => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
      tempDir = null;
    }
  };

  const forwardSignal = (signal) => {
    if (!child.killed) {
      child.kill(signal);
    }
  };

  process.on("SIGINT", () => forwardSignal("SIGINT"));
  process.on("SIGTERM", () => forwardSignal("SIGTERM"));

  child.once("error", (error) => {
    cleanupTemp();
    console.error("[rocksoul] failed to launch:", error);
    process.exit(1);
  });

  child.once("exit", (code, signal) => {
    cleanupTemp();
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

void main();
