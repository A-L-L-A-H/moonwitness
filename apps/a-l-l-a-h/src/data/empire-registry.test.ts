import { describe, expect, it } from "vitest";
import {
  COVENANT_PILLARS,
  DOCK_TELEMETRY_NODES,
  NAVIGATION_TABS,
  SIDRA_KNOWLEDGE_AXIOMS,
  WORLD_DOMAINS,
} from "./empire-registry";

describe("Empire of the Light Registry", () => {
  it("defines the four primary navigation tabs", () => {
    expect(NAVIGATION_TABS.map((tab) => tab.label)).toEqual([
      "THE GATE",
      "THE WORLDS",
      "THE DOCK",
      "ABOUT",
    ]);
  });

  it("defines all five worlds with exact reference titles and taglines", () => {
    expect(WORLD_DOMAINS.map((world) => ({ name: world.name, tagline: world.tagline }))).toEqual([
      { name: "MOONWITNESS", tagline: "Stories · Knowledge · Archive" },
      { name: "ARSY", tagline: "Radio · Technology · Infrastructure" },
      { name: "QALAM", tagline: "Create · Write · Share" },
      { name: "SIDRA", tagline: "Connect · Explore · Learn" },
      { name: "ROCKSOUL DX", tagline: "Play · Create · Dream" },
    ]);
  });

  it("maintains dock telemetry coherence across all five world gateways", () => {
    expect(DOCK_TELEMETRY_NODES).toHaveLength(5);
    const worldIds = new Set(WORLD_DOMAINS.map((world) => world.id));
    for (const node of DOCK_TELEMETRY_NODES) {
      expect(worldIds.has(node.worldId)).toBe(true);
      expect(node.integrityPercent).toBeGreaterThanOrEqual(99.9);
    }
  });

  it("connects Sidra knowledge axioms in a valid symmetric graph", () => {
    const axiomIds = new Set(SIDRA_KNOWLEDGE_AXIOMS.map((axiom) => axiom.id));
    for (const axiom of SIDRA_KNOWLEDGE_AXIOMS) {
      expect(axiom.connectedIds.length).toBeGreaterThan(0);
      for (const targetId of axiom.connectedIds) {
        expect(axiomIds.has(targetId)).toBe(true);
      }
    }
  });

  it("encodes the three covenant pillars matching the hero motto", () => {
    expect(COVENANT_PILLARS.map((pillar) => pillar.heading)).toEqual([
      "A WORLD TO WITNESS",
      "A WORLD TO LEARN",
      "A WORLD TO BUILD",
    ]);
  });
});
