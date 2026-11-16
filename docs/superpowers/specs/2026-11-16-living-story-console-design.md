# Spec: Living Story Console — Layout Game / Film Animasi untuk apps/web

Tanggal: 2026-11-16
Status: disetujui owner; eksekusi didelegasikan pada 2026-11-16. Checkpoint berikutnya melalui verifikasi dan review internal.
Batas kerja: **UI/UX dan frontend saja.** Auth, API, database, dan deploy dikerjakan tim lain dan tidak disentuh di spec ini.

---

## 1. Masalah yang diselesaikan

1. `apps/web` sudah jauh lebih sesuai ARTS setelah remediasi visual, tapi **kerangka halamannya masih pola app SaaS biasa**: topbar + konten kartu. Owner ingin pengalaman yang terasa seperti **main game / nonton film animasi**, bukan mengisi form.
2. Dari brainstorm muncul 3 arah visual (mockup di `vibe_images/`):
   - **A — Game HUD**: chrome konsol game (rail, gauge, corner bracket) mengelilingi konten kerja.
   - **B — Manga/Film Scene**: halaman dibaca seperti adegan/shot film, bukan daftar kartu.
   - **C — World-Map OS**: navigasi wilayah seperti peta game dengan node sinyal.
3. Keputusan owner: **ketiganya digabung** jadi satu sistem, komponen reusable di `packages/ui`, pilot di `/mission-control`.

## 2. Konsep: Living Story Console

Satu sistem, tiga **lapisan permukaan (surface layer)**. Satu route memakai satu lapisan dominan; lapisan boleh menumpuk (HUD membungkus Scene, Scene membungkus Atlas).

| Lapisan | Nama               | Dipakai di                                                                    | Karakter                                                                                                                                |
| ------- | ------------------ | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| L1      | **HUD Console**    | route kerja: `/mission-control`, `/dock`, `/control`; `/shadow` tetap sign-in | Chrome game HUD: top rail tipis, side rail ikon, command strip bawah, sudut panel pakai corner bracket, gauge kecil untuk metrik        |
| L2      | **Scene (Adegan)** | route cerita: landing, story studio, ideas, transmission                      | Panel dibaca seperti shot film animasi: chapter banner, scrim gradasi di atas art, film strip untuk urutan adegan, caption ala subtitle |
| L3      | **Atlas**          | navigasi region: peta/world map                                               | Panggung atlas: peta besar jadi stage, node kota + garis sinyal (signal graph), backdrop art                                            |

Yang berubah = **kerangka presentasi** (chrome, susunan panel, cara membaca). Konten, data, dan navigasi yang ada **tidak berubah fungsinya**.

## 3. Keputusan yang sudah diambil

| #   | Keputusan                                                                                                                                                                                                                                         | Alasan                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| D1  | Tiga konsep A+B+C digabung jadi 3 lapisan permukaan dalam satu sistem                                                                                                                                                                             | Owner: "kombinasikan saja"; tiap konsep cocok untuk kelas route yang berbeda                                      |
| D2  | Semua komponen kerangka baru di **`packages/ui`**; `apps/web` cuma wiring data/nav/`artSrc`                                                                                                                                                       | Owner: "di package ui, agar reusable"                                                                             |
| D3  | **Tanpa dependensi baru.** Motion CSS-only, selalu di belakang `prefers-reduced-motion`                                                                                                                                                           | Konsisten dengan keputusan desain 2026-11-11                                                                      |
| D4  | Pilot: **`/mission-control`** (L1 HUD Console) dengan `EmpireShell` diganti wrapper `ConsoleShell`; `WorkspaceShell`/`Sidebar`/`Topbar` **tidak diubah** dan tetap dipakai route lain. Setelah approved baru rollout route kerja lain, lalu L2/L3 | Perubahan besar perlu validasi visual satu halaman dulu tanpa blast radius ke semua route                         |
| D5  | **Dark-first.** Light theme tidak dikerjakan sekarang, tapi scrim gelap hardcode wajib diganti token                                                                                                                                              | `theme.css` belum punya light theme sama sekali; scrim hardcode `rgba(7,7,12,…)` bikin light theme mustahil nanti |
| D6  | Skin-compat 3 poin (lihat bagian 5) — wajib masuk scope pilot                                                                                                                                                                                     | Mencegah gesekan skin system dan tema saat rollout                                                                |
| D7  | **Tidak ada lettering/teks di dalam gambar hasil generate**; semua teks di HTML/CSS                                                                                                                                                               | Kebijakan art pipeline yang sudah berlaku                                                                         |
| D8  | Semua interaksi baru punya fallback keyboard; fokus terlihat; komponen ikut `SkipLink` yang sudah ada                                                                                                                                             | A11y bukan tambahan, syarat                                                                                       |

## 4. Struktur komponen baru di `packages/ui`

### 4.1 Primitif kerangka HUD — `primitives/hud-chrome.tsx`

Komponen presentasi murni, tanpa state global, tanpa data.

```ts
TopRail; // baris tipis atas: kiri = judul route + status, kanan = aksi global (slot)
SideRail; // rail ikon vertikal sempit (ikon + label kecil, aktif = accent pink)
CommandStrip; // strip bawah: primary action + shortcut keyboard (mis. "G — goto")
CornerBrackets; // 4 sudut panel ala viewfinder kamera (pseudo-element, murni CSS)
Gauge; // metrik kecil: label + nilai + bar tipis (pakai token --pink/--blue/--yellow)
```

Semua menerima `className` + `children` (slot), tidak membatasi isi. `SideRail` menerima `items: {id,label,icon,active,href?}` dan `onSelect`.

### 4.2 Shell konsol — `composites/console-shell.tsx`

```ts
ConsoleShell; // grid kerangka L1: TopRail / SideRail / konten / CommandStrip.
// Layout: konten scrollable pakai min-h-0 (gotcha flex yang sudah dikenal),
// container query aware — side rail collapse jadi strip bawah di < @[30rem]
```

`apps/web` memakainya dengan cara: data nav dari `nav-items.ts`, konten = section yang sudah ada (status, studios, pipeline, dst.). Tidak ada logika bisnis di shell.

### 4.3 Komponen adegan — `composites/scene-page.tsx`

```ts
ScenePage; // pembungkus L2: urutan panel adegan vertikal dengan ritme spacing bervariasi
ScenePanel; // satu shot: art background (slot) + scrim gradasi token + konten di atasnya
ChapterBanner; // pembuka bab: nomor bab besar + judul, gaya splash manga (font-display yang ada)
FilmStrip; // baris horizontal item ber-kerangka perforasi ala strip film (scroll-snap)
```

`ScenePanel` wajib menerima `scrim` yang dihitung dari token (lihat 6.2), bukan rgba hardcode.

### 4.4 Panggung atlas — `composites/atlas-stage.tsx`

```ts
AtlasStage; // pembungkus L3: peta besar + overlay node + panel detail wilayah (slot)
```

Di dalamnya, **`SignalGraph` diekstrak dari `composites/world-map.tsx`** (SVG node + garis sinyal dashed pink/blue) jadi komponen internal reusable, lalu `WorldMap` di-refactor menjadi konsumen `AtlasStage` + `SignalGraph` — API publik `WorldMap` **tidak berubah** (wrapper compat).

### 4.5 Token & utility CSS — `theme.css`

Tambahan hanya utility class, semua nilai dari token yang sudah ada (`--ink`, `--panel`, `--panel-2`, `--paper`, `--pink`, `--blue`, `--yellow`, `--line`):

```css
.hud-panel  /* panel kerangka HUD: bg --panel-2, border --line, sudut bracket */
.hud-edge   /* garis aksen 2px di tepi (top/bottom/left/right via modifier) */
```

**Tidak boleh** ada warna hardcode (literal hex/rgba) di komponen atau utility baru.

### 4.6 Export

Semua komponen + tipe props diekspor dari `packages/ui/src/index.ts` mengikuti pola yang sudah ada.

## 5. Skin compatibility — 3 poin wajib (D6)

Berdasarkan investigasi `packages/ui/src/skin/*`, `apps/web/src/components/providers.tsx`, `skin-switcher.tsx`:

### 5.1 Tidak ada konflik mekanis, tapi komponen baru "invisible" ke skin

`SkinProvider.getClasses` hanya memetakan 7 key: `button | card | input | badge | eventCard | kanbanColumn | moduleCard` ([packages/ui/src/skin/index.ts:1](../../packages/ui/src/skin/index.ts)). Komponen HUD/Scene/Atlas baru tidak akan ketimpa atau rusak — mereka hanya tidak ikut berubah saat user ganti skin. Ini feature gap, bukan bug.
**Tindakan:** daftarkan key baru `hudPanel`, `scenePanel`, `atlasStage` di `baseClasses` + field di `SkinPreset` (default preset = kelas kosong/effects `''`).

### 5.2 Efek skin vs chrome HUD

Preset skin punya `effects` (`riot` = halftone grain cmyk-slip, `transmission` = scanlines) dan CVA per-skin. Kalau HUD merender texture sendiri saat user pakai skin `editorial`, hasilnya double-texture.
**Tindakan:** komponen HUD/Scene/Atlas tidak memakai effect class sendiri secara default; slot effect ikut preset skin lewat key baru di 5.1. Texture bawaan komponen (mis. `Halftone`) hanya dipakai lewat props eksplisit oleh consumer.

### 5.3 Tema & scrim hardcode

`theme.css` tidak punya light theme (tidak ada `.light`/`data-theme`), semua token gelap. Kode existing sudah punya scrim hardcode `rgba(7,7,12,…)` di `ideas.tsx`, `status.tsx`, `world-map.tsx` — masalah ini **sudah ada sebelum spec ini** dan diperparah HUD yang gelap total.
**Tindakan:**

- (a) Di komponen **baru**: larangan total warna hardcode (4.5).
- (b) Di komponen **existing yang disentuh pilot**: ganti scrim `rgba(7,7,12,X)` jadi `color-mix(in srgb, var(--ink) X%, transparent)`.
- (c) Light theme tetap **non-goal** (D5), tapi setelah (b) token siap dipakai kalau nanti dibuat.

## 6. Aturan styling & perilaku

### 6.1 Token

Semua warna/spasi dari token `theme.css` yang ada. Tidak ada warna, font, atau dependensi baru.

### 6.2 Scrim & legibilitas

Scrim gradasi di atas art wajib dari `color-mix(in srgb, var(--ink) …%)` dengan pemberhentian yang menjamin kontras teks (teks di atas art wajib lolos WCAG AA terhadap hasil akhir scrim+art; art paling gelap dipakai sebagai uji kasus).

### 6.3 Motion

Hanya CSS (transition/animation sederhana: hover lift, scanline, gauge fill). Semua dibungkus `@media (prefers-reduced-motion: reduce)` → state statis. Pola variant Tailwind v4 yang benar: `sm:[@media(prefers-reduced-motion:no-preference)]:…` (urutan variant motion setelah breakpoint).

### 6.4 Responsif & flex

Container query (`@[30rem]`, `@[34rem]`) seperti pola existing; child scrollable di kolom flex pakai `min-h-0`; overflow horizontal = defect (verifikasi 1672/390/360).

### 6.5 Aksesibilitas

Rail dan strip navigable via keyboard (tab / arrow, `Enter` memilih); `aria-current` untuk item aktif; fokus terlihat memakai ring yang ada; `SkipLink` tetap pertama; landmark `nav`/`main` benar.

## 7. Wiring di `apps/web` (pilot)

`/mission-control` sekarang dirender lewat `EmpireShell` → `WorkspaceShell` ([apps/web/src/components/command-center/index.tsx:32](../../apps/web/src/components/command-center/index.tsx)) yang punya chrome sendiri: sidebar `w-60`, topbar (breadcrumb + search + notifikasi + profile menu), section tracking via IntersectionObserver, logout, footer. Pilot **mengganti `EmpireShell` di route ini saja** dengan wrapper tipis di `apps/web` (mis. `components/shell/console-shell-adapter.tsx`) yang memetakan props yang sama ke komponen UI baru:

| Chrome lama (`WorkspaceShell`)                                        | Pengganti pilot                                                                                                                       |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `Sidebar` (nav `nav-items.ts`, section tracking aktif)                | `SideRail` — menerima `items`, `active`, `activeSection`, `onNavigate`; tracking tetap hidup                                          |
| `Topbar` (breadcrumb, search, notifications, profile, avatar, logout) | `TopRail` — judul + slot kanan; `Notifications`, `ProfileMenu`, search di-pass sebagai slot, logika identitas/logout tetap di adapter |
| footer (`footerLeft`/`footerRight`)                                   | `CommandStrip`                                                                                                                        |

Agar tidak menduplikasi logika, blok IntersectionObserver di `workspace-shell.tsx:70-98` diekstrak jadi hook `useActiveSection(items, pathname)` di `apps/web/src/components/shell/`; `WorkspaceShell` dan adapter pilot sama-sama memakainya. `WorkspaceShell` tetap dipakai route lain tanpa perubahan perilaku.

Konten section existing dari `components/command-center/*` **tidak ditulis ulang**; yang berubah pembungkus halaman dan susunan grid kerangka.

`studios.tsx` / `ideas.tsx` (section story) menjadi konsumen `ScenePanel` pada tahap rollout L2 — **bukan pilot**.

- Art tetap lewat `artSrc(key)` dari `apps/web/src/lib/art.ts`; art baru (kalau perlu) mengikuti pipeline: generate → `apps/web/public/art/` → daftar di `packages/assets` → optimize. Referensi ARTS di `packages/assets/references/` tidak ditimpa.

## 8. Error handling & states

- Layer kerangka tidak menambah fetch baru; tidak ada state loading baru.
- Slot kosong (mis. gauge tanpa data) = elemen tidak dirender, bukan placeholder palsu.
- State kosong/error konten tetap tanggung jawab section existing.

## 9. Pengujian

1. `pnpm --filter @moonwitness/ui typecheck`, `pnpm --filter @moonwitness/web typecheck`, lint — 0 error.
2. Test UI baru: render minimal per komponen (pola `dna-worlds.test.ts`/`presets.test.ts`), termasuk skin-compat (5.1): ganti preset memengaruhi kelas `hudPanel`.
3. Test existing `packages/ui` + `apps/web` tetap hijau (API `WorldMap` tidak berubah).
4. Verifikasi browser manual (owner yang menjalankan dev server): golden path + resize 1672/390/360 + keyboard-only + `prefers-reduced-motion`.
5. Overflow check lebar-vs-scrollWidth seperti remediasi sebelumnya.

## 10. Non-goals

- Light theme (D5), tipografi baru, drag-and-drop, route/auth/API baru, backend, deploy.
- Mengubah konten/fungsi section existing di luar yang disinggung pilot.
- Menghapus komponen lama (kecuali refactor internal `world-map.tsx` yang menjaga API).

## 11. Tahapan implementasi

1. **Pilot L1**: token utility (4.5) → `hud-chrome.tsx` → `console-shell.tsx` → terapkan di `/mission-control` → skin-compat 5.1–5.3 untuk file yang disentuh → verifikasi (bagian 9).
2. **Rollout L1**: `/shadow`, `/dock`, `/control` ganti shell-nya ke adapter `ConsoleShell` (satu per satu, tetap review per route).
3. **L2 Scene**: `scene-page.tsx` + landing/story sections.
4. **L3 Atlas**: ekstraksi `SignalGraph` + `AtlasStage`, refactor `WorldMap` compat.
5. Tiap tahap: verifikasi penuh + review owner sebelum lanjut.

Setiap tahap adalah unit commit terpisah (sesuai kebiasaan commit scope task).
