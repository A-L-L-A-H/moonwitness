import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Living Story Console route composition", () => {
  it("rolls out the HUD to Dock without changing its timeline state", () => {
    const dock = source("../src/components/dock/index.tsx");
    expect(dock).toContain("<ConsoleShellAdapter");
    expect(dock).not.toContain("EmpireShell");
    expect(dock).toContain("useTimelineEvents");
  });

  it("retains the operations boundary for Control", () => {
    const control = source("../src/components/control/index.tsx");
    expect(control).toContain("<ConsoleShellAdapter");
    expect(control).toContain('plane="operations"');
    expect(control).toContain("<ControlGate>");
  });

  it("uses HUD progress and framing without a nested button inside a link", () => {
    const hero = source("../src/components/command-center/hero.tsx");
    expect(hero).toContain("<Gauge");
    expect(hero).toContain("<CornerBrackets");
    expect(hero).toMatch(/<Button\s+asChild/);
    expect(hero).not.toMatch(/<Link[^>]*>[\s\S]*?<Button/);
  });
});
