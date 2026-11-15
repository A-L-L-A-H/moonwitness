# Visual Rendering & Shader Research — A-L-L-A-H.COM (The Living Light)

## 1. Visual Direction: Sacred Minimalism × Cinematic Immersion × Infinite Light
The aesthetic covenant of A-L-L-A-H.COM preserves the monumentality of **IMPERIUM LUMEN** and elevates it with real-time atmospheric light:
- **Monumental Abstract Architecture**: Symmetrical obsidian citadels arched around an infinite light gateway over a mirror-still obsidian water plane.
- **Celestial Lighting**: Focused zenith rays, golden horizon scatter, and disciplined contrast rather than muddy neon bloom.
- **Strict Negative Boundaries**: Zero depictions of Allah, zero human/animal faces, zero cartoons or anime, zero SaaS dashboard chrome, zero decorative Arabic/Qur'anic calligraphy used merely as wallpaper noise.

---

## 2. Rendering Technology Comparison (WebGPU vs. Three.js/R3F vs. Raw WebGL2 GLSL)

### 2.1 WebGPU
- **Assessment**: WebGPU brings compute shaders and modern pipeline ergonomics, and has shipped in Chromium desktop browsers (Chrome 113+) and newer Edge releases. However, Safari WebGPU remains behind progressive flags or recent OS releases, and Linux/older Android WebView compatibility remains inconsistent for public global visitors.
- **Decision**: **Defer WebGPU** as primary renderer for now to guarantee consistent first-visit visuals on Windows, macOS, iOS Safari, Android Chrome, and headless CI Chromium environments. WebGL2 remains the universal GPU baseline.

### 2.2 Three.js / React Three Fiber (R3F)
- **Assessment**: Ideal for articulated 3D mesh scenes, PBR glTF loading, and physics worlds. However, shipping `three` + `@react-three/fiber` (~150KB+ gzipped) just to render atmospheric god-rays, horizon volumetric scattering, and water caustics over a composite architectural gate introduces heavy bundle size and GPU memory overhead with minimal upside.
- **Decision**: **Not Adopted** for the core portal canvas. A custom zero-dependency WebGL2 GLSL fragment shader (~4KB source) achieves higher frame rates at <3% of the bundle size.

### 2.3 Raw WebGL2 GLSL ES 3.00 + 2D Canvas Hybrid (ADOPTED)
- **Browser Support**: >98% global availability across modern desktop and mobile browsers (with automatic `webgl` / 2D Canvas fallback if context creation fails).
- **Bundle Footprint**: ~4KB TypeScript/GLSL, zero external package installations, zero shader compilation stall (single full-screen triangle/quad vertex shader + analytical fragment shader).

---

## 3. Three-Layer Living Background Architecture

```
+-------------------------------------------------------------------+
| Layer 3 (z-20): Interactive Typography, Gate Threshold, Five Dock |
+-------------------------------------------------------------------+
| Layer 2 (z-10): 2D Canvas — Sidereal Motes, Orbital Meridian Arc, |
|                 Interactive Elliptical Water Ripples on Click     |
+-------------------------------------------------------------------+
| Layer 1 (z-5):  WebGL2 GLSL Fragment Shader (`LivingLightShader`) |
|                 - Volumetric Zenith Light Pillar & God Rays       |
|                 - Atmospheric Gold/Midnight Horizon Scattering    |
|                 - Pointer & Scroll-Reactive Water Caustics        |
+-------------------------------------------------------------------+
| Layer 0 (z-0):  Static High-Res Celestial Vista (`celestial-gate`)|
|                 + Scroll-Depth Parallax + Vignette Legibility     |
+-------------------------------------------------------------------+
```

### 3.1 Analytical GLSL Effects (`LivingLightShader`)
Instead of expensive multi-pass brute-force ray-marching loops that overheat mobile GPUs, the fragment shader uses **analytical volumetric light-shaft integration** blended via `screen` / soft-additive compositing (`mix-blend-screen` / alpha-premultiplied transparency over the obsidian architectural vista):
1. **Zenith Meridian Beam**: Gaussian falloff centered at `x = 0.5 + pointerOffset`, modulated by organic multi-octave sine interference to create slow, breathing cathedral shafts descending toward the gate archway (`y = 0.62`).
2. **Horizon Bloom & Twilight Atmosphere**: Warm champagne gold (`#dfc07b` / `#fff4d2`) around the horizon vanishing line fading into deep cosmic black (`#040509`) and midnight blue (`#080a12`).
3. **Obsidian Basin Caustics (`y > 0.66`)**: Depth-foreshortened horizontal specular light ribbons shimmering beneath the archway and reacting subtly to pointer X/Y and Sanctuary Radiance toggle (`u_radiance`).

### 3.2 Procedural Geometry (`Sacred Icons` + `Rocksoul DX`)
- Crisp resolution-independent vector SVGs (`OctagramMandalaIcon`, `PortalAstrolabeIcon`, `MoonwitnessCrestIcon`, `ArsyTowerIcon`, `QalamNibIcon`, `SidraPolyhedronIcon`, `RocksoulCubeIcon`) render without raster pixelation at any Retina DPR.
- `Rocksoul DX` runs an interactive real-time procedural Girih mandala synthesizer (`6–24 fold symmetry`, harmonic aperture radius, sidereal angular velocity).

---

## 4. GPU Resource & Battery Stewardship
- **DPR Capping**: WebGL2 drawing buffer caps `devicePixelRatio` at `1.75` to prevent 4K Retina fill-rate bottlenecks while preserving crisp light gradients.
- **Visibility Pausing**: `IntersectionObserver` pauses shader rendering when `#the-gate` leaves the viewport; `visibilitychange` pauses both WebGL2 and 2D Canvas loops when the browser tab is backgrounded.
- **Context Loss Resilience**: Listens to `webglcontextlost` (`event.preventDefault()`) and falls back seamlessly to Layer 0 + Layer 2 without throwing runtime errors.
