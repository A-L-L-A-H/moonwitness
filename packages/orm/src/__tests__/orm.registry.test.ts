import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  closeDb,
  defineModel,
  extendModel,
  getDb,
  initDb,
  modelRegistry,
  onModelWrite,
} from "../index.js";

describe("ORM ModelRegistry, extendModel, _attrs custom fields & outbox hooks", () => {
  beforeEach(() => {
    modelRegistry.clearForTests();
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearForTests();
  });

  it("extends a base model via extendModel() and persists extended fields dynamically", async () => {
    await initDb("file::memory:?cache=shared");

    const baseNote = defineModel({
      name: "test.ext_note",
      table: "test_ext_notes",
      extensible: true,
      schema: z.object({
        title: z.string().min(1),
      }),
    });

    extendModel("test.ext_note", {
      addon: "ext-addon",
      fields: z.object({
        canon_ref: z.string().nullable().default(null),
        priority: z.number().int().default(1),
      }),
      indexes: [{ fields: ["canon_ref"] }],
    });

    const composed = modelRegistry.get("test.ext_note");
    expect(composed).toBeDefined();
    expect(composed?.ddl).toContain('"canon_ref" TEXT');
    expect(composed?.ddl).toContain('"_attrs" TEXT');
    await getDb().exec(composed!.ddl);

    const created = (await baseNote.repository.create({
      title: "Witness Signal",
      canon_ref: "patch-014",
      priority: 3,
    })) as unknown as Record<string, unknown>;
    expect(created.canon_ref).toBe("patch-014");
    expect(created.priority).toBe(3);

    const found = await baseNote.repository.find({ canon_ref: "patch-014" });
    expect(found).toHaveLength(1);
    expect(found[0]?.title).toBe("Witness Signal");
  });

  it("validates registered runtime custom fields stored in _attrs on extensible models", async () => {
    await initDb("file::memory:?cache=shared");

    const ticket = defineModel({
      name: "test.ticket",
      table: "test_tickets",
      extensible: true,
      schema: z.object({
        summary: z.string().min(1),
      }),
    });
    await getDb().exec(modelRegistry.get("test.ticket")!.ddl);

    modelRegistry.setRuntimeCustomFields("test.ticket", [
      {
        field_name: "severity",
        field_type: "selection",
        selection: ["low", "high"],
        required: true,
      },
      { field_name: "points", field_type: "integer", required: false },
    ]);

    await expect(
      ticket.repository.create({ summary: "Missing required custom attr", _attrs: {} }),
    ).rejects.toThrow();

    await expect(
      ticket.repository.create({
        summary: "Bad selection value",
        _attrs: { severity: "invalid-option" },
      }),
    ).rejects.toThrow();

    const okRow = (await ticket.repository.create({
      summary: "Valid extensible record",
      _attrs: { severity: "high", points: 5 },
    })) as unknown as { id: string; _attrs: Record<string, unknown> };
    expect(okRow._attrs).toEqual({ severity: "high", points: 5 });

    const updated = (await ticket.repository.update(okRow.id, {
      _attrs: { points: 8 },
    })) as unknown as { _attrs: Record<string, unknown> } | null;
    expect(updated?._attrs).toEqual({ severity: "high", points: 8 });
  });

  it("emits onModelWrite outbox events matching wildcard/prefix and supports unsubscribe", async () => {
    await initDb("file::memory:?cache=shared");

    const itemModel = defineModel({
      name: "outbox.item",
      table: "outbox_items",
      schema: z.object({
        label: z.string().min(1),
      }),
    });
    await getDb().exec(itemModel.ddl);

    const handler = vi.fn();
    const unsub = onModelWrite("outbox.*", handler);

    const row = await itemModel.repository.create({ label: "Alpha" });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "outbox.item",
        action: "CREATE",
        entityId: row.id,
      }),
    );

    await itemModel.repository.update(row.id, { label: "Beta" });
    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenLastCalledWith(
      expect.objectContaining({
        model: "outbox.item",
        action: "UPDATE",
        entityId: row.id,
      }),
    );

    unsub();
    await itemModel.repository.archive(row.id);
    expect(handler).toHaveBeenCalledTimes(2);
  });
});
