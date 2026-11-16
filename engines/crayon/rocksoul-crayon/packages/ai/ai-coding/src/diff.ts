export interface DiffChange {
  type: 'add' | 'remove' | 'keep';
  line: string;
}

export function computeSimpleDiff(original: string, updated: string): DiffChange[] {
  const origLines = original.split('\n');
  const updLines = updated.split('\n');
  const result: DiffChange[] = [];

  const maxLen = Math.max(origLines.length, updLines.length);
  for (let i = 0; i < maxLen; i++) {
    const o = origLines[i];
    const u = updLines[i];

    if (o === undefined && u !== undefined) {
      result.push({ type: 'add', line: u });
    } else if (o !== undefined && u === undefined) {
      result.push({ type: 'remove', line: o });
    } else if (o === u) {
      result.push({ type: 'keep', line: o });
    } else {
      result.push({ type: 'remove', line: o! });
      result.push({ type: 'add', line: u! });
    }
  }

  return result;
}

export function formatUnifiedDiff(filename: string, changes: DiffChange[]): string {
  const lines = [`--- a/${filename}`, `+++ b/${filename}`];
  for (const c of changes) {
    if (c.type === 'add') lines.push(`+ ${c.line}`);
    else if (c.type === 'remove') lines.push(`- ${c.line}`);
    else lines.push(`  ${c.line}`);
  }
  return lines.join('\n');
}
