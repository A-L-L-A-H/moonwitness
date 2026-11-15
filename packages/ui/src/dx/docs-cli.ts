// Moonwitness DX — CLI-only docs writer (Node.js only, not exported to browser)
import {
  generateDocsMarkdown,
  generateTokenDocs,
  generateSkinDocs,
  generateThemeCSSDocs,
} from "./docs";

export function writeDocs(outputDir: string): void {
  if (typeof window !== "undefined") return;

  import("fs").then((fs) => {
    import("path").then((path) => {
      fs.mkdirSync(outputDir, { recursive: true });

      const markdown = generateDocsMarkdown();
      fs.writeFileSync(path.join(outputDir, "design-system.md"), markdown, "utf-8");

      const tokenDocs = generateTokenDocs();
      fs.writeFileSync(
        path.join(outputDir, "tokens.json"),
        JSON.stringify(tokenDocs, null, 2),
        "utf-8",
      );

      const skinDocs = generateSkinDocs();
      fs.writeFileSync(
        path.join(outputDir, "skins.json"),
        JSON.stringify(skinDocs, null, 2),
        "utf-8",
      );

      const themeCSS = generateThemeCSSDocs();
      for (const [name, css] of Object.entries(themeCSS)) {
        fs.writeFileSync(path.join(outputDir, `theme-${name}.css`), css, "utf-8");
      }
    });
  });
}
