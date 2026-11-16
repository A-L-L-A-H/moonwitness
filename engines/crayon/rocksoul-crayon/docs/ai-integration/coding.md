# Coding & Workspace Sandboxing

**Packages**: `@rocksoul/ai-workspace`, `@rocksoul/ai-coding`  
**Status**: INTEGRATED & VERIFIED

---

## 1. Workspace Sandboxing

Coding agents are strictly forbidden from having unrestricted access to the host filesystem. All file operations must pass through `SandboxedWorkspace`:

```typescript
// Path traversal protection
export class SandboxedWorkspace implements IWorkspace {
  resolveSafePath(relPath: string): string {
    const fullPath = normalize(resolve(this.rootPath, relPath));
    const rel = relative(this.rootPath, fullPath);

    if (rel.startsWith('..') || rel.includes(`..${'/'}`) || rel.includes(`..${'\\'}`)) {
      throw new Error(`Access Denied: Attempted path traversal outside workspace sandbox: ${relPath}`);
    }

    return fullPath;
  }
}
```

---

## 2. Diffing & Patching

`@rocksoul/ai-coding` provides deterministic line-by-line diff generation (`computeSimpleDiff`) and unified diff formatting (`formatUnifiedDiff`). Patches can be previewed or applied safely within the workspace boundary.
