# CRAYON Production Accessibility

Status: active production-hardening work for #128

Accessibility is a renderer invariant, not a separate truth system. Dark/Light, keyboard, reduced-motion, forced-colors, and non-visual access must preserve the same semantic claims about uncertainty, availability, consequence, authority, resistance, and witness.

## Main-only executable gate

`npm run accessibility:lab` runs against the real production Lab build with Playwright from the `living-crayon` workflow on `main`.

The current gate verifies:

- Dark Flagship is the default and Dark/Light selection exposes `aria-pressed`;
- theme selection works by keyboard;
- keyboard traversal reaches theme, scenario, semantic zoom, Inspector, and semantic trajectory representation;
- CRAYON trajectories are focusable in semantic traversal order rather than incidental renderer order;
- Current orientation, Present state, and Available semantic trajectories expose accessible region labels;
- `unknown`, `partial`, `witness`, and `resistance` survive as text and are not color-only meaning;
- Dark and Light critical foreground tokens meet at least 4.5:1 against their intended background/surface;
- reduced-motion mode removes material Lab transition duration;
- forced-colors mode is supported and preserves semantic text;
- mobile viewport rejects document-level horizontal overflow.

## Contrast policy

The executable gate measures these normal-text pairs in both themes:

```text
text          / page background
muted         / surface
accent-strong / surface
witness       / surface
semantic      / surface
danger        / surface
```

Minimum current admission target: **4.5:1**.

A real audit found the former Light Companion witness token too weak for normal text. It was darkened from `#2f8e6a` to `#247355`; the new token is enforced by the browser gate instead of relying on visual judgment.

## High-contrast and reduced-motion behavior

The Lab and Web renderer contain explicit `prefers-reduced-motion`, `prefers-contrast`, and `forced-colors` rules. System colors are allowed to replace renderer palette decisions in forced-colors mode; semantic labels and state text remain authoritative.

## Remaining production evidence

Before #128 can close as production-proven, CRAYON still needs:

- broader automated WCAG/ARIA rules beyond the custom smoke;
- multi-domain keyboard/screen-reader beta evidence;
- baseline evidence from verified `main` rather than dev-only implementation;
- accessibility regression review as part of beta admission.

Accessibility adaptations may change presentation. They may not change semantic meaning.
