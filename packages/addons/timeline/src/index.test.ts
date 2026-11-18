import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { applyMigrations, closeDb, initDb, listAppliedMigrations } from "@moonwitness/orm";
import { timelineManifest, timelineMigrations } from "./index.js";

describe("timeline addon (transport-agnostic)", () => {
  beforeEach(async () => {
    await initDb(":memory:");
  });

  afterEach(async () => {
    await closeDb();
  });

  it("exports manifest and versioned migrations with timeline owner", () => {
    expect(timelineManifest.name).toBe("timeline");
    expect(timelineMigrations.length).toBeGreaterThan(0);
    expect(timelineMigrations[0]?.owner).toBe("timeline");
  });

  it("applies timeline migrations idempotently", async () => {
    const first = await applyMigrations(timelineMigrations);
    expect(first.applied).toEqual(["timeline_001_initial"]);
    expect(first.skipped).toEqual([]);

    const second = await applyMigrations(timelineMigrations);
    expect(second.applied).toEqual([]);
    expect(second.skipped).toEqual(["timeline_001_initial"]);

    const applied = await listAppliedMigrations("timeline");
    expect(applied).toHaveLength(1);
    expect(applied[0]?.owner).toBe("timeline");
  });
});
