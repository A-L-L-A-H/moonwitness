export const PUBLIC_PACKAGES = Object.freeze([
  { name: "allah-crayon-kernel", workspace: "packages/kernel" },
  { name: "allah-crayon-physics", workspace: "packages/physics" },
  { name: "allah-crayon-snapshot", workspace: "packages/snapshot" },
  { name: "allah-crayon-rir", workspace: "packages/rir" },
  { name: "allah-crayon-inspector", workspace: "packages/inspector" },
  { name: "allah-crayon-agent", workspace: "packages/renderer-agent" },
  { name: "allah-crayon-voice", workspace: "packages/renderer-voice" },
  { name: "allah-crayon-react", workspace: "packages/renderer-web" },
]);

export const PUBLIC_PACKAGE_NAMES = Object.freeze(PUBLIC_PACKAGES.map((item) => item.name));
