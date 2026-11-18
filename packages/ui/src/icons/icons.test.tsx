import { readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import * as Icons from "./index";

describe("Sovereign DNA Icon Engine (@moonwitness/ui/icons)", () => {
  const iconsDir = resolve(__dirname);
  const iconEntries = Object.entries(Icons).filter(
    ([name, value]) =>
      typeof value === "function" && name !== "resolveIconSvgProps" && name !== "WorldEmblemById",
  );

  it("renders valid semantic aria-hidden SVG elements for every exported icon", () => {
    expect(iconEntries.length).toBeGreaterThanOrEqual(100);
    for (const [name, IconComponent] of iconEntries) {
      const Component = IconComponent as React.ComponentType<Icons.DnaIconProps>;
      const markup = renderToStaticMarkup(<Component size={20} className="test-dna-icon" />);
      expect(markup, `Icon ${name} did not render an <svg>`).toContain("<svg");
      expect(markup, `Icon ${name} missing aria-hidden`).toContain('aria-hidden="true"');
      expect(markup, `Icon ${name} missing className forwarding`).toContain(
        'class="test-dna-icon"',
      );
    }

    const worldIds: Icons.WorldIconId[] = [
      "moonwitness",
      "arsy",
      "human-pen",
      "sidra",
      "rocksoul-dx",
      "crayon",
      "sin-can",
      "mythos",
      "angel-with-shotgun",
    ];
    for (const worldId of worldIds) {
      const markup = renderToStaticMarkup(<Icons.WorldEmblemById worldId={worldId} />);
      expect(markup).toContain("<svg");
    }
  });

  it("contains zero hardcoded hex, rgb(), or hsl() literals across icons/*", () => {
    const files = readdirSync(iconsDir).filter(
      (name) => (name.endsWith(".ts") || name.endsWith(".tsx")) && !name.endsWith(".test.tsx"),
    );
    const forbidden = /#[0-9a-fA-F]{3,6}\b|rgba?\(|hsla?\(/g;
    const offenders: string[] = [];

    for (const file of files) {
      const source = readFileSync(join(iconsDir, file), "utf8");
      const matches = source.match(forbidden);
      if (matches) {
        offenders.push(`${file}: ${matches.join(", ")}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
