import { generateKeyPairSync } from "node:crypto";
import { afterAll, afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { closeDb, initDb, modelRegistry } from "@moonwitness/orm";
import {
  AddonRuntimeController,
  baseManifest,
  signAddonManifest,
  verifyAddonManifestSignature,
  type AddonManifestInput,
} from "./index.js";

describe("@moonwitness/addon-runtime manifest signing", () => {
  const dirs: string[] = [];

  beforeEach(async () => {
    modelRegistry.clearCustomFieldsForTests();
    const dir = mkdtempSync(join(tmpdir(), "mw-sign-"));
    dirs.push(dir);
    await initDb(join(dir, "sign.db"));
  });

  afterEach(() => {
    closeDb();
    modelRegistry.clearCustomFieldsForTests();
  });

  afterAll(() => {
    for (const dir of dirs) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // Ignore transient Windows SQLite lock on cleanup.
      }
    }
  });

  it("signs and verifies addon capability manifests with Ed25519 and HMAC-SHA256", () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const unsigned: AddonManifestInput = {
      name: "demo_pack",
      version: "1.2.0",
      depends: ["__base"],
      capabilities: ["ops.scheduler", "canon.eval"],
      provides: { routes: ["demo"] },
    };

    const signedEd = signAddonManifest(unsigned, {
      algorithm: "ed25519",
      keyId: "key-ed-1",
      privateKey,
    });
    expect(
      verifyAddonManifestSignature(signedEd, [
        { algorithm: "ed25519", keyId: "key-ed-1", publicKey },
      ]),
    ).toEqual({ status: "verified", keyId: "key-ed-1" });

    // Tamper capability list after signing -> must fail verification.
    const tampered: AddonManifestInput = {
      ...signedEd,
      capabilities: ["ops.scheduler", "admin.root"],
    };
    const tamperedCheck = verifyAddonManifestSignature(tampered, [
      { algorithm: "ed25519", keyId: "key-ed-1", publicKey },
    ]);
    expect(tamperedCheck.status).toBe("invalid");

    const signedHmac = signAddonManifest(unsigned, {
      algorithm: "hmac-sha256",
      keyId: "key-hmac-1",
      secret: "top-secret-signing-material",
    });
    expect(
      verifyAddonManifestSignature(signedHmac, [
        { algorithm: "hmac-sha256", keyId: "key-hmac-1", secret: "top-secret-signing-material" },
      ]),
    ).toEqual({ status: "verified", keyId: "key-hmac-1" });
  });

  it("enforces strict signature policy in AddonRuntimeController and persists verification metadata", async () => {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const trustedKeys = [{ algorithm: "ed25519" as const, keyId: "root-1", publicKey }];

    const strictRuntime = new AddonRuntimeController();
    await expect(
      strictRuntime.syncAll(
        [{ manifest: { ...baseManifest, autoInstall: true, defaultEnabled: true } }],
        undefined,
        { signingPolicy: { mode: "strict", trustedKeys } },
      ),
    ).rejects.toThrow(/strict signature policy/i);

    const signedBase = signAddonManifest(
      { ...baseManifest, autoInstall: true, defaultEnabled: true },
      { algorithm: "ed25519", keyId: "root-1", privateKey },
    );
    const verifiedRuntime = new AddonRuntimeController();
    await verifiedRuntime.syncAll([{ manifest: signedBase }], undefined, {
      signingPolicy: { mode: "strict", trustedKeys },
    });

    const rows = await verifiedRuntime.listAddons();
    expect(rows[0]?.signature_status).toBe("verified");
    expect(rows[0]?.signature_key_id).toBe("root-1");
  });
});
