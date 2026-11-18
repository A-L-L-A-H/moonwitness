// @vitest-environment jsdom
import { SKIN_ARTWORK_MAP } from "@moonwitness/assets";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SkinProvider, type SkinName } from "../skin";
import { SkinArtworkFrame } from "./skin-artwork-frame";

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});

describe("SkinArtworkFrame", () => {
  it.each(Object.keys(SKIN_ARTWORK_MAP) as SkinName[])(
    "renders distinct responsive picture artwork and cutout for skin %s",
    (skin) => {
      act(() =>
        root.render(
          <SkinProvider defaultSkin={skin} persist={false}>
            <SkinArtworkFrame className="h-48 w-full" />
          </SkinProvider>,
        ),
      );

      const frame = container.querySelector('[data-mw-skin-frame="true"]');
      expect(frame?.getAttribute("data-mw-art-key")).toBe(
        SKIN_ARTWORK_MAP[skin as keyof typeof SKIN_ARTWORK_MAP].artKey,
      );
      expect(frame?.querySelector("picture source[type='image/avif']")).not.toBeNull();
      expect(frame?.querySelector("svg[data-mw-backdrop-skin]")).not.toBeNull();
    },
  );
});
