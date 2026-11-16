import { describe, expect, it } from "vitest";
import { hashPassword, hashPasswordPbkdf2, verifyPassword } from "./auth";

describe("shared auth hashing", () => {
  it("hashes and verifies PBKDF2-SHA256 digests cleanly", async () => {
    const hash = await hashPasswordPbkdf2("moonwitness-secret-2026");
    expect(hash.startsWith("$pbkdf2-sha256$100000$")).toBe(true);
    await expect(verifyPassword("moonwitness-secret-2026", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-secret", hash)).resolves.toBe(false);
  });

  it("hashes passwords with Node bcrypt when available and rejects tampered digests", async () => {
    const hash = await hashPassword("moonwitness-secret-2026");
    await expect(verifyPassword("moonwitness-secret-2026", hash)).resolves.toBe(true);
    await expect(verifyPassword("wrong-secret", hash)).resolves.toBe(false);

    const pbkdf2 = await hashPasswordPbkdf2("moonwitness-secret-2026");
    const tampered = pbkdf2.slice(0, -2) + (pbkdf2.endsWith("00") ? "ff" : "00");
    await expect(verifyPassword("moonwitness-secret-2026", tampered)).resolves.toBe(false);
  });
});
