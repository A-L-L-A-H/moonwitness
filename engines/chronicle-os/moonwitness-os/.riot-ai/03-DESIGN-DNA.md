# 03 — R!OT Design DNA

## North star

# CHAOS BRUTAL GRUNGE GEN Z FUNKY

**Controlled chaos. Maximum character. Zero template boredom.** The canvas may look rebellious; the interface must remain engineered.

The design should feel like a collision of underground gig posters, DIY zines, photocopied punk flyers, brutal editorial design, comic-book motion, industrial warning systems, retro-futurist consoles, and absurd internet culture. Avoid the polished-but-empty look of a generic SaaS dashboard.

## Five DNA pillars

### 1. CHAOS BRUTAL

- Oversized condensed typography and assertive scale contrast.
- Hard edges, cut corners, off-grid blocks, unexpected alignment, asymmetrical composition.
- Visible ink-like strokes, sharp dividers, offset shadows, numbered panels.
- Large typographic statements and graphic punctuation.
- Use deliberate imbalance; never sacrifice hierarchy or alignment in data-heavy areas.

### 2. GRUNGE / XEROX

- Photocopier grain, xerox noise, paper fibers, halftone dots, ink bleed, distressed print, torn edges.
- Tape strips, staples, photocopied labels, misregistration, stamp marks, scuffs, and rough collage.
- Textures should be original and subtle enough not to compete with body text.
- Build textures as reusable assets or opt-in overlays; do not attach heavy filters to every component.

### 3. GEN Z / INTERNET CULTURE

- Playful, meme-aware microcopy; irreverent but not hostile or juvenile.
- Unexpected stickers, status labels, tiny jokes, visual easter eggs, and expressive empty states.
- Use humor as seasoning, not as a replacement for clear product language.
- Avoid slang that will age immediately in critical navigation and documentation.

### 4. INDUSTRIAL / COMMAND DECK

- Grid systems, technical labels, serial codes, monospace metadata, instrument-like readouts.
- Dense but legible tables, modular panels, precise spacing, clear status colors.
- Brushed metal and machine-panel ideas are references for composition, not a requirement to simulate photorealistic metal.
- Operational screens can use the Industrial preset while retaining the R!OT identity.

### 5. FUNKY ARTWORK / COMIC ENERGY

- Original mascot characters, manga speed lines, comic impact bursts, pop-art shapes, strange objects, expressive silhouettes.
- Sticker packs, collage compositions, poster-like hero panels, abstract signal creatures, hand-drawn arrows and circles.
- Original vector systems and procedural art; not stock assets and not imitations of famous characters or artists.

## Visual intensity model

Implement one global, strongly typed `chaosIntensity` setting:

| Level | Intended use | Visual expression |
|---|---|---|
| `calm` | Dense operations, accessibility preference | Texture nearly absent, clean geometry, small accent marks |
| `balanced` | Default admin use | Visible R!OT typography and selected stickers, controlled texture |
| `loud` | Default brand expression | Strong collage, bold type, louder color and graphic separators |
| `extreme` | Hero/demo/marketing/editorial | Full poster energy, strong overlays, asymmetry and motion |

Intensity changes decoration, composition, and motion only. It must never change content meaning, keyboard behavior, or information hierarchy.

## Theme presets

Build four named presets over shared semantic tokens. Each preset must support light and dark mode.

1. **R!OT OVERDRIVE** — primary signature. Ink black, paper white, acid lime, signal red, and a controlled electric-blue accent. Loud type, high contrast, poster energy.
2. **R!OT XEROX** — photocopied paper, deep ink, worn gray, one loud red/pink accent. Editorial, zine-like, rough print textures.
3. **R!OT ACID POP** — acid lime, hot pink, cobalt/electric blue, violet, and ink. Funky, playful, high-energy; use color with semantic discipline.
4. **R!OT INDUSTRIAL** — graphite, steel/paper neutrals, hazard orange, signal lime, technical labels. Operational, control-room, precise.

Do not hardcode colors across components. Define semantic tokens such as `--riot-bg`, `--riot-surface`, `--riot-surface-raised`, `--riot-fg`, `--riot-muted`, `--riot-border`, `--riot-primary`, `--riot-secondary`, `--riot-danger`, `--riot-warning`, `--riot-success`, `--riot-focus`, and chart-specific tokens.

Initial color direction (calibrate contrast and dark/light variants during implementation):

- Ink: `#11110F`
- Deep asphalt: `#20211F`
- Paper: `#F2F0E8`
- Clean paper: `#FFFDF6`
- Acid lime: `#D7FF00`
- Signal orange: `#FF5A1F`
- Riot pink: `#FF3EA5`
- Electric blue: `#315BFF`
- Violet: `#8D4DFF`
- Concrete: `#B9B7AE`

These are starting values, not permission to use every accent in every component. Validate contrast for each theme and mode.

## Typography system

Choose real, licensable, performant fonts. Verify their licenses before shipping. Suggested role directions (not mandatory if better installed fonts exist):

- Display: heavy/condensed editorial face such as Archivo Black or Barlow Condensed.
- Body/UI: highly readable geometric sans such as Space Grotesk or a robust system alternative.
- Technical metadata: IBM Plex Mono or another legible monospace.
- Handwritten accent: a marker/handwriting face such as Caveat or Permanent Marker, used only for annotations and tiny bursts.

Define semantic roles, not font names in every component:

- `font-display`
- `font-body`
- `font-mono`
- `font-hand`

Do not render long paragraphs or critical labels in distressed/display fonts. Use uppercase selectively; avoid making all body copy uppercase.

## Shape, border, and shadow language

- Prefer square/compact geometry, hard borders, cut corners, label tabs, and a few intentionally irregular shapes.
- Use a small radius scale. Reserve rounded pills for tags, indicators, and controls where useful.
- Use offset ink shadows for expressive cards and buttons; shadows should be deliberate and theme-aware.
- Prefer lines, contrast, and composition over giant blurred glows or glassmorphism.
- A component may expose `shape` or `treatment` variants, but avoid dozens of arbitrary styling props.

## Texture and graphic vocabulary

Create reusable overlays and assets for:

- xerox grain
- photocopier dust
- halftone dot fields
- torn paper edges
- tape and label strips
- ink stamps
- misregistration / chromatic shift
- scanlines / signal interference
- manga speed lines
- crosshatch and marker scribbles
- impact bursts / comic speech shapes
- industrial warning stripes
- rough frames and paper borders

Use each texture with a defined opacity, blend mode, and allowed context. Ensure text contrast remains safe. Provide a clean mode and reduce textures on low-power/mobile settings if required.

## Layout composition

- Use asymmetry in heroes, onboarding, empty states, marketing pages, and section introductions.
- Keep app-shell navigation and content grids predictable.
- Put expressive art in dedicated layers so it cannot obscure charts, forms, or controls.
- Use visual anchors: page title, eyebrow/serial label, one signature graphic, primary action, then content.
- Avoid every page having the same card-grid silhouette. Offer a small library of editorial layouts: split hero, full-bleed poster, offset columns, stacked panels, side-note rail, dense instrument board, and clean data workspace.

## Original character direction

Develop an original R!OT character family, for example:

- **R!OT GREMLIN:** primary chaos mascot; compact, expressive, irregular silhouette; curious troublemaker, not frightening.
- **STATIC RAT:** cable-tangled signal scout; useful for network, infrastructure, and error states.
- **BYTE GOBLIN:** tiny data hoarder/collector; useful for analytics, storage, and empty states.
- **WRENCH GHOST:** industrial helper; useful for system maintenance, deployment, and repair.

Names may be refined after concept exploration. Keep a consistent silhouette, proportions, palette, material treatment, and personality across poses. Do not generate random unrelated characters. Do not borrow recognizable copyrighted mascots.

## Motion and interaction

- Motion should feel punchy: snap, stomp, flick, slide, punch-in, tiny shake, signal jitter, and sticker peel.
- Keep essential interaction states immediate and predictable.
- Avoid perpetual motion in data-heavy views. Use motion to clarify state changes and create moments of delight.
- Respect `prefers-reduced-motion` and provide a runtime motion preference.
- Do not animate large noisy backgrounds continuously by default.

## Signature moments

Include original R!OT treatment in:

- App loading/boot sequence.
- Dashboard hero/command deck.
- Module landing/section intro.
- Empty, error, maintenance, 404, and 500 states.
- Theme selector and theme lab.
- Notification/alert states.
- Documentation cover and marketing/landing demo.

## Anti-DNA: do not ship

- Generic blue/purple SaaS gradient everywhere.
- Beige minimalism as the default identity.
- Glass cards with blurred backgrounds as the entire visual system.
- Giant rounded cards and pill buttons on every element.
- Random grunge texture with no art direction.
- Generic stock illustrations or random generated clipart.
- Low-contrast gray text on noisy backgrounds.
- Uncontrolled animation, unreadable type, and gratuitous glitch effects.
- A visually loud landing page followed by a completely generic app.

**Design acceptance:** a screenshot of the dashboard, a data-heavy module, an empty state, and the component showcase should all look unmistakably R!OT, while remaining legible and usable.
