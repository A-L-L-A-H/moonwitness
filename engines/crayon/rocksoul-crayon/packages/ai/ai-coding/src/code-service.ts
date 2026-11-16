import type { IWorkspace } from '@rocksoul/ai-workspace';
import type { ExecutionContext } from '@rocksoul/ai-core';
import { computeSimpleDiff, formatUnifiedDiff } from './diff.js';

export interface CodeInspectionResult {
  filePath: string;
  content: string;
  totalLines: number;
}

export interface PatchResult {
  filePath: string;
  diff: string;
  applied: boolean;
}

export class CodingService {
  constructor(private workspace: IWorkspace) {}

  async readFile(filePath: string, _context: ExecutionContext): Promise<CodeInspectionResult> {
    const content = await this.workspace.readFile(filePath);
    return {
      filePath,
      content,
      totalLines: content.split('\n').length,
    };
  }

  async applyPatch(filePath: string, newContent: string, _context: ExecutionContext): Promise<PatchResult> {
    const exists = await this.workspace.exists(filePath);
    const originalContent = exists ? await this.workspace.readFile(filePath) : '';

    const diffChanges = computeSimpleDiff(originalContent, newContent);
    const diff = formatUnifiedDiff(filePath, diffChanges);

    await this.workspace.writeFile(filePath, newContent);

    return {
      filePath,
      diff,
      applied: true,
    };
  }

  async listSourceFiles(subDir: string = '.', _context: ExecutionContext): Promise<string[]> {
    const files = await this.workspace.listFiles(subDir);
    return files.filter((f) => !f.isDirectory).map((f) => f.path);
  }
}
