// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  Container,
  EmptyStateArt,
  Flow,
  Grid,
  GridItem,
  HStack,
  HeroIllustration,
  Input,
  LoadingConstellation,
  MASTER_DNA_IDS,
  MotionReveal,
  Select,
  SelectTrigger,
  SelectValue,
  SkinProvider,
  SkinRoot,
  Stack,
  Tabs,
  TabsList,
  TabsTrigger,
  VStack,
  WorldArtwork,
  ZStack,
} from "../index";

let container: HTMLDivElement;
let root: Root;

function renderNode(node: React.ReactNode) {
  act(() => {
    root.render(node);
  });
}

beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  vi.unstubAllGlobals();
});

describe("PR 7 Accessibility, Reduced Motion & Layout/Artwork Contracts", () => {
  it("enforces prefers-reduced-motion fallbacks across all stylesheets and MotionReveal", () => {
    const baseCss = readFileSync(resolve(import.meta.dirname, "../base.css"), "utf8");
    const dnaBaseCss = readFileSync(resolve(import.meta.dirname, "../skins/dna-base.css"), "utf8");
    const imperiumCss = readFileSync(resolve(import.meta.dirname, "../skins/imperium.css"), "utf8");

    expect(baseCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(dnaBaseCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(imperiumCss).toContain("@media (prefers-reduced-motion: reduce)");

    renderNode(
      <SkinRoot dnaId="01-imperium-lumen">
        <MotionReveal disabled data-testid="static-reveal">
          <span>Readable at rest</span>
        </MotionReveal>
      </SkinRoot>,
    );
    const reveal = container.querySelector(".mw-motion-reveal");
    expect(reveal?.classList.contains("is-static")).toBe(true);
  });

  it("ensures 44px minimum touch-target class contract on primary interactive controls", () => {
    renderNode(
      <SkinProvider defaultSkin="default" persist={false}>
        <Button data-testid="btn-target">Continue</Button>
        <Input data-testid="input-target" aria-label="Search universe" />
        <Select defaultValue="a">
          <SelectTrigger data-testid="select-target" aria-label="Choose option">
            <SelectValue />
          </SelectTrigger>
        </Select>
        <Tabs defaultValue="t1">
          <TabsList data-testid="tabs-target">
            <TabsTrigger value="t1">Tab</TabsTrigger>
          </TabsList>
        </Tabs>
      </SkinProvider>,
    );

    expect(container.querySelector('[data-testid="btn-target"]')?.className).toContain("min-h-11");
    expect(container.querySelector('[data-testid="input-target"]')?.className).toContain(
      "min-h-11",
    );
    expect(container.querySelector('[data-testid="select-target"]')?.className).toContain(
      "min-h-11",
    );
    expect(container.querySelector('[data-testid="tabs-target"]')?.className).toContain("min-h-11");
  });

  it("renders layout primitives and artwork SVGs with explicit accessible roles and labels", () => {
    renderNode(
      <Container>
        <Flow>
          <Grid cols={2}>
            <GridItem>
              <Stack>
                <VStack>
                  <HStack>
                    <ZStack>
                      <HeroIllustration title="Sacred Skyline" />
                    </ZStack>
                  </HStack>
                </VStack>
              </Stack>
            </GridItem>
            <GridItem>
              <EmptyStateArt label="Nothing active" />
              <LoadingConstellation label="Loading telemetry" />
              {MASTER_DNA_IDS.map((dnaId) => (
                <WorldArtwork key={dnaId} dnaId={dnaId} />
              ))}
            </GridItem>
          </Grid>
        </Flow>
      </Container>,
    );

    const imgs = container.querySelectorAll('svg[role="img"]');
    expect(imgs.length).toBe(3 + MASTER_DNA_IDS.length);
    for (const svg of imgs) {
      expect(svg.getAttribute("aria-label")?.trim().length).toBeGreaterThan(0);
    }
  });
});
