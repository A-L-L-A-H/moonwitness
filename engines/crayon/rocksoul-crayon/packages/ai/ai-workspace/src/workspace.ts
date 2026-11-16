import { resolve, relative, normalize } from 'node:path';
import { promises as fs } from 'node:fs';

export interface WorkspaceFile {
  path: string;
  size: number;
  isDirectory: boolean;
}

export interface IWorkspace {
  readonly rootPath: string;
  resolveSafePath(relativePath: string): string;
  readFile(relativePath: string): Promise<string>;
  writeFile(relativePath: string, content: string): Promise<void>;
  listFiles(dirPath?: string): Promise<WorkspaceFile[]>;
  exists(relativePath: string): Promise<boolean>;
}

export class SandboxedWorkspace implements IWorkspace {
  readonly rootPath: string;

  constructor(rootPath: string) {
    this.rootPath = normalize(resolve(rootPath));
  }

  resolveSafePath(relPath: string): string {
    const fullPath = normalize(resolve(this.rootPath, relPath));
    const rel = relative(this.rootPath, fullPath);

    if (rel.startsWith('..') || rel.includes(`..${'/'}`) || rel.includes(`..${'\\'}`)) {
      throw new Error(`Access Denied: Attempted path traversal outside workspace sandbox: ${relPath}`);
    }

    return fullPath;
  }

  async exists(relPath: string): Promise<boolean> {
    try {
      const path = this.resolveSafePath(relPath);
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async readFile(relPath: string): Promise<string> {
    const safePath = this.resolveSafePath(relPath);
    return await fs.readFile(safePath, 'utf8');
  }

  async writeFile(relPath: string, content: string): Promise<void> {
    const safePath = this.resolveSafePath(relPath);
    const parentDir = resolve(safePath, '..');
    await fs.mkdir(parentDir, { recursive: true });
    await fs.writeFile(safePath, content, 'utf8');
  }

  async listFiles(relDir: string = '.'): Promise<WorkspaceFile[]> {
    const safePath = this.resolveSafePath(relDir);
    const entries = await fs.readdir(safePath, { withFileTypes: true });

    return Promise.all(
      entries.map(async (entry) => {
        const full = resolve(safePath, entry.name);
        const stats = await fs.stat(full);
        return {
          path: relative(this.rootPath, full).replace(/\\/g, '/'),
          size: stats.size,
          isDirectory: entry.isDirectory(),
        };
      })
    );
  }
}

export interface IWorkspaceProvider {
  getWorkspace(workspaceId: string): Promise<IWorkspace>;
}

export class LocalWorkspaceProvider implements IWorkspaceProvider {
  private baseDir: string;

  constructor(baseDir: string = process.cwd()) {
    this.baseDir = resolve(baseDir);
  }

  async getWorkspace(workspaceId: string): Promise<IWorkspace> {
    // Isolated workspace directory per ID if given, or root workspace if workspaceId === 'root'
    const targetDir = workspaceId === 'root' || workspaceId === 'default'
      ? this.baseDir
      : resolve(this.baseDir, 'workspaces', workspaceId);

    return new SandboxedWorkspace(targetDir);
  }
}
