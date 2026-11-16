import React, { type ReactNode } from "react";
import { SkinProvider } from "../skin/index";
import { SkinScope, type MasterDnaId } from "../skin/dna-worlds";
import type { SkinName } from "../skin/compositions";

export function withSkinHarness(
  children: ReactNode,
  options: { skin?: SkinName; dnaId?: MasterDnaId } = {},
) {
  const { skin = "default", dnaId = "02-lunar-chronicles" } = options;
  return React.createElement(SkinProvider, {
    defaultSkin: skin,
    children: React.createElement(SkinScope, { dnaId, children }),
  });
}
