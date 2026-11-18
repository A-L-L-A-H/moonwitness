import {
  createHmac,
  sign as cryptoSign,
  verify as cryptoVerify,
  timingSafeEqual,
  type KeyObject,
} from "node:crypto";
import {
  AddonManifestSchema,
  type AddonManifest,
  type AddonManifestInput,
  type AddonManifestSignature,
} from "./registry.js";

export type AddonSignerConfig =
  | {
      algorithm: "ed25519";
      keyId: string;
      privateKey: string | KeyObject;
    }
  | {
      algorithm: "hmac-sha256";
      keyId: string;
      secret: string | Buffer;
    };

export type TrustedAddonSigningKey =
  | {
      algorithm: "ed25519";
      keyId: string;
      publicKey: string | KeyObject;
    }
  | {
      algorithm: "hmac-sha256";
      keyId: string;
      secret: string | Buffer;
    };

export interface AddonSignatureVerificationResult {
  status: "verified" | "unsigned" | "invalid";
  keyId: string | null;
  reason?: string;
}

export interface AddonSigningPolicy {
  mode?: "permissive" | "strict";
  trustedKeys?: readonly TrustedAddonSigningKey[];
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

/**
 * Serialize the capability-bearing fields of an addon manifest into canonical bytes
 * suitable for deterministic Ed25519 / HMAC-SHA256 signing and verification.
 */
export function canonicalizeAddonManifestPayload(
  manifest: AddonManifest | AddonManifestInput,
): string {
  const parsed = AddonManifestSchema.parse(manifest);
  const canonicalSubject = {
    name: parsed.name,
    version: parsed.version,
    depends: [...parsed.depends],
    capabilities: [...parsed.capabilities],
    provides: parsed.provides,
  };
  return JSON.stringify(sortValue(canonicalSubject));
}

/**
 * Attach a cryptographic `signature` block over an addon manifest's identity and capabilities.
 */
export function signAddonManifest(
  manifest: AddonManifestInput,
  signer: AddonSignerConfig,
): AddonManifestInput {
  const payload = Buffer.from(canonicalizeAddonManifestPayload(manifest), "utf-8");
  let digest: string;
  if (signer.algorithm === "ed25519") {
    digest = cryptoSign(null, payload, signer.privateKey).toString("base64");
  } else {
    digest = createHmac("sha256", signer.secret).update(payload).digest("base64");
  }
  const signature: AddonManifestSignature = {
    algorithm: signer.algorithm,
    keyId: signer.keyId,
    digest,
    signedAt: new Date().toISOString(),
  };
  return {
    ...manifest,
    signature,
  };
}

/**
 * Verify an addon manifest signature against the trusted key ring using timing-safe comparison.
 */
export function verifyAddonManifestSignature(
  manifest: AddonManifest | AddonManifestInput,
  trustedKeys: readonly TrustedAddonSigningKey[] = [],
): AddonSignatureVerificationResult {
  const parsed = AddonManifestSchema.parse(manifest);
  if (!parsed.signature) {
    return { status: "unsigned", keyId: null, reason: "Manifest has no signature block." };
  }

  const key = trustedKeys.find(
    (candidate) =>
      candidate.keyId === parsed.signature!.keyId &&
      candidate.algorithm === parsed.signature!.algorithm,
  );
  if (!key) {
    return {
      status: "invalid",
      keyId: parsed.signature.keyId,
      reason: `No trusted ${parsed.signature.algorithm} key found for keyId '${parsed.signature.keyId}'.`,
    };
  }

  const payload = Buffer.from(canonicalizeAddonManifestPayload(parsed), "utf-8");
  if (key.algorithm === "ed25519") {
    const signatureBuf = Buffer.from(parsed.signature.digest, "base64");
    const valid = cryptoVerify(null, payload, key.publicKey, signatureBuf);
    return valid
      ? { status: "verified", keyId: key.keyId }
      : { status: "invalid", keyId: key.keyId, reason: "Ed25519 signature verification failed." };
  }

  const expected = createHmac("sha256", key.secret).update(payload).digest();
  const actual = Buffer.from(parsed.signature.digest, "base64");
  const valid = expected.length === actual.length && timingSafeEqual(expected, actual);
  return valid
    ? { status: "verified", keyId: key.keyId }
    : { status: "invalid", keyId: key.keyId, reason: "HMAC-SHA256 digest mismatch." };
}
