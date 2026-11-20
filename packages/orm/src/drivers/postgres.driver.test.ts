import { describe, expect, it, vi } from "vitest";
import { PostgresDriver, type PoolLike } from "./postgres.driver.js";
import { closeDbAsync, initPostgresDb } from "../driver.js";

function delayedEndPool(delayMs: number): { pool: PoolLike; endSpy: ReturnType<typeof vi.fn> } {
  let resolveEnd: (() => void) | null = null;
  const endPromise = new Promise<void>((resolve) => {
    resolveEnd = resolve;
  });
  const endSpy = vi.fn(() => {
    setTimeout(() => resolveEnd!(), delayMs);
    return endPromise;
  });
  const pool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => {
      throw new Error("not used");
    },
    end: endSpy,
  } as unknown as PoolLike;
  return { pool, endSpy };
}

describe("PostgresDriver.closeAsync", () => {
  it("waits for PoolLike.end() to resolve before returning", async () => {
    const driver = new PostgresDriver();
    const { pool, endSpy } = delayedEndPool(50);
    await driver.init("postgres://user:pass@localhost:5432/db", pool);
    await driver.closeAsync();
    expect(endSpy).toHaveBeenCalledTimes(1);
  });

  it("is safe when called repeatedly", async () => {
    const driver = new PostgresDriver();
    const { pool, endSpy } = delayedEndPool(0);
    await driver.init("postgres://user:pass@localhost:5432/db", pool);
    await driver.closeAsync();
    await driver.closeAsync();
    await driver.closeAsync();
    expect(endSpy).toHaveBeenCalledTimes(1);
  });

  it("is safe with no pool initialized", async () => {
    const driver = new PostgresDriver();
    await expect(driver.closeAsync()).resolves.toBeUndefined();
  });

  it("resolves even when pool end() rejects", async () => {
    const driver = new PostgresDriver();
    const pool = {
      query: async () => ({ rows: [], rowCount: 0 }),
      connect: async () => {
        throw new Error("not used");
      },
      end: async () => {
        throw new Error("pool terminated");
      },
    } as unknown as PoolLike;
    await driver.init("postgres://user:pass@localhost:5432/db", pool);
    await expect(driver.closeAsync()).resolves.toBeUndefined();
  });
});

describe("closeDbAsync", () => {
  it("awaits async close of the active Postgres driver", async () => {
    const { pool, endSpy } = delayedEndPool(30);
    await initPostgresDb("postgres://user:pass@localhost:5432/db", pool);
    await closeDbAsync();
    expect(endSpy).toHaveBeenCalledTimes(1);
  });

  it("is safe when called with no open database", async () => {
    await expect(closeDbAsync()).resolves.toBeUndefined();
  });
});
