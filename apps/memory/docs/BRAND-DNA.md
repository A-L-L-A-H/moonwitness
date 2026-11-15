# HOW U REMIND ME — Product DNA

**A MoonWitness product / Memory Deck interface language v2**

## Brand architecture

- **MoonWitness** is the parent brand and the local-first memory platform.
- **How U Remind Me** is the product interface for importing chat archives, finding useful knowledge, and tracing it back to source messages.

## Creative direction

**Funky Gen-Z × Riot × Chaotic × Sarcastic**

The emotional tone is direct and reflective, with street-level phrasing, dry dark humor, and visible attitude. The interface may tease messy exports; it never mocks users, sensitive experiences, failed jobs, privacy concerns, or data loss. Product actions and system states stay literal and easy to understand.

The writing and artwork are original. General ideas such as memory, reflection, regret, and finding perspective may inform the mood; song lyrics, lyric paraphrases, and song or band artwork are not used.

## Identity pillars

1. **Riot archive** — labels, stamps, folders, index numbers, registration marks, and evidence cards.
2. **Chaotic intelligence** — collage rhythm and graphic interruptions, with a dependable reading order.
3. **Grunge rock** — warm paper, asphalt-dark surfaces, scuffed lines, photocopy grain, and hard edges.
4. **Memory in motion** — original cassette-and-notes artwork to make preservation and source trails recognizable.
5. **Working console** — high-contrast states, visible system status, and tactile controls that remain usable during long sessions.

## Palette and materials

| Token               | Dark theme | Light theme | Usage                                         |
| ------------------- | ---------- | ----------- | --------------------------------------------- |
| Token               | Dark theme | Light theme | Usage                                         |
| ---                 | ---        | ---         | ---                                           |
| Surrounding asphalt | `#100E0B`  | `#E0D9CA`   | Space around the machine                      |
| Deck chassis        | `#292720`  | `#BDB39F`   | Physical shell and hardware                   |
| CRT glass           | `#171912`  | `#EDE8D8`   | The single active workspace                   |
| Worn yellow         | `#E7D96B`  | `#816900`   | Primary actions and healthy states            |
| Signal red          | `#F08B72`  | `#8D3325`   | Errors, warnings, and editorial interruptions |
| Paper               | `#F0EADC`  | `#241F17`   | Main interface text                           |
| Muted               | `#B2AA95`  | `#625A4C`   | Secondary labels and metadata                 |

Use yellow for the active mode, primary action, and healthy states; reserve red for warnings and interruption. The light theme remains a piece of hardware rather than becoming a generic white dashboard.

## Typography

- Display: Barlow Condensed / Impact fallback for headlines, panel titles, and counters.
- UI/body: IBM Plex Sans / Arial fallback for controls, prose, and metadata.
- Use tabular numerals and letter spacing for readouts; do not shrink telemetry until it becomes difficult to read.

Remote fonts are progressive enhancement; all content remains legible without them.

## Memory Deck hardware grammar

- One persistent device shell contains one CRT-like workspace. The four physical mode keys switch the workspace between **Deck**, **Tape Library**, **Transfer**, and **Memory Index**; the inactive mode is not stacked below the current one.
- The chassis, fascia, status lamps, mode selectors, CRT frame, cassette bay, transport bay, and label typography share one material system. Avoid generic SaaS navigation rails, card grids as the page structure, and decorative device trim detached from real controls.
- The CRT contains the real application UI and only the selected mode. Its restrained scanline treatment is the one persistent visual effect; keep all text, filters, errors, and data readable above it.
- The Overview cassette label shows the latest real archive filename, size, date, and processing state. A chat archive is not video or audio: use the cassette strictly as an archive metaphor, never to invent playback or timecode for chat data.
- The separate soundtrack cassette is clearly labeled as audio. Its PLAY/PAUSE, STOP, REWIND, FAST-FORWARD, and seek controls operate the supplied MP3; playback is user-initiated and never auto-starts.
- **LOAD ARCHIVE** opens the existing ZIP/JSON picker. Show the real upload percentage and error state in the shared CRT, regardless of the currently selected mode.
- Use hard borders, readable labels, worn paper, chassis details, and original cassette geometry. Do not copy a particular VCR manufacturer, product silhouette, song, or band artwork.
- At tablet widths the fascia and controls reflow; on phones the mode keys become a two-by-two switch bank, records become single-column rows/cards, and controls retain a 44px minimum touch target. Avoid horizontal overflow at 320px.

## Interaction and product truth

- Keep the dark console and light paper themes. Initialize the saved theme before first paint and retain the existing `mw-memory-theme` storage key.
- The mode buttons switch the single workspace; there is no scroll-position-driven navigation or stack of all workflows.
- Motion is restrained and respects `prefers-reduced-motion`.
- Every action has a real status or disabled state. Upload progress reflects transferred bytes.
- The audio deck is separate from imported archives. Rewind and fast-forward seek the real MP3 by 10 seconds, stop returns it to the beginning, and the seek range reflects actual elapsed time and duration.
- Engine labels distinguish API reachability, configured credentials, optional integrations, and queued/failed jobs. Configured integrations are not presented as verified live connections.
- Search, import, resume, Drive backup, and NDJSON export stay connected to the existing API.
- The Vault keeps filename/ID search, processing and Drive filters, sorting, SHA-256, and backup details.
- Queue progress reflects actual worker checkpoints; backup-only jobs never show a fabricated conversation percentage.
- Knowledge records retain tags, entities, extracted content, and their original source-message trail.
- Archive drop works with mouse, drag-and-drop, and keyboard activation. The provenance reader retains Escape dismissal, focus trapping, scroll locking, and focus restoration.
- Keep the interface as one local utility; do not split the Vault, Queue, and Knowledge into disconnected pages.

## Voice examples

Use short, original copy with attitude where it does not obscure the task:

- Hero: “Your chats. Less chaos. More context.”
- Import explanation: “Chat exports are chaos with timestamps. Pull out decisions and ideas worth keeping, then jump back to the original message when you need receipts.”
- Empty state: state plainly what is missing and what action will help.
- Errors and privacy copy: direct, respectful, and specific. No jokes when data is at risk.

## Do / don't

**Do:** use index numbers, stamps, paper grain, halftone, hard borders, condensed display type, original vector artwork, and a dry aside in low-risk moments.

**Don't:** quote or paraphrase song lyrics; imitate a song or band’s artwork; use generic gradients, excessive neon, emoji as primary controls, tiny low-contrast labels, or jokes that obscure an action or minimize a failure.

## Accessibility and performance

- Give every control an accessible name and a visible focus state.
- Prefer CSS and vector artwork to large raster assets.
- Respect reduced-motion settings and preserve keyboard use.
- Use semantic landmarks and real button/link elements.
