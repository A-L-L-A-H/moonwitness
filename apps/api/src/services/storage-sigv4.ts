import { createHash, createHmac } from "node:crypto";

const ALGORITHM = "AWS4-HMAC-SHA256";
const REGION = "us-east-1";
const SERVICE = "s3";

export interface StorageSigningCredentials {
  accessKey: string;
  secretKey: string;
}

export function getStorageSigningCredentials(
  env: NodeJS.ProcessEnv = process.env,
): StorageSigningCredentials | null {
  const accessKey = env.STORAGE_ACCESS_KEY?.trim();
  const secretKey = env.STORAGE_SECRET_KEY?.trim();
  if (!accessKey || !secretKey) return null;
  return { accessKey, secretKey };
}

function uriEncode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) => {
    return `%${character.charCodeAt(0).toString(16).toUpperCase()}`;
  });
}

function decodeQueryComponent(value: string): string {
  return decodeURIComponent(value.replace(/\+/g, " "));
}

function parseQuery(rawQuery: string): Array<[string, string]> {
  if (!rawQuery) return [];
  return rawQuery
    .split("&")
    .filter(Boolean)
    .map((pair) => {
      const separator = pair.indexOf("=");
      if (separator === -1) return [decodeQueryComponent(pair), ""] as [string, string];
      return [
        decodeQueryComponent(pair.slice(0, separator)),
        decodeQueryComponent(pair.slice(separator + 1)),
      ];
    });
}

export function canonicalStoragePath(pathname: string): string {
  const decoded = pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");
  const canonical = decoded.split("/").map((segment) => uriEncode(segment)).join("/");
  return /^\/[^/]+$/.test(canonical) ? `${canonical}/` : canonical;
}

export function encodeStoragePath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => uriEncode(decodeURIComponent(segment)))
    .join("/");
}

export function canonicalStorageQuery(rawQuery: string): string {
  const pairs: Array<[string, string]> = parseQuery(rawQuery).map(([key, value]) => [
    uriEncode(key),
    uriEncode(value),
  ]);
  pairs.sort(([leftKey, leftValue], [rightKey, rightValue]) => {
    if (leftKey !== rightKey) return leftKey < rightKey ? -1 : 1;
    return leftValue === rightValue ? 0 : leftValue < rightValue ? -1 : 1;
  });
  return pairs.map(([key, value]) => `${key}=${value}`).join("&");
}

export function hasCallerSignatureQuery(rawQuery: string): boolean {
  return parseQuery(rawQuery).some(([key]) => key.toLowerCase().startsWith("x-amz-"));
}

function hmac(key: Buffer, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

export function signStorageRequest(
  method: string,
  url: URL,
  body: Buffer,
  credentials: StorageSigningCredentials,
  now: Date = new Date(),
): Record<string, string> {
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = createHash("sha256").update(body).digest("hex");
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonicalHeaders =
    `host:${url.host.toLowerCase()}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`;
  const canonicalRequest = [
    method.toUpperCase(),
    canonicalStoragePath(url.pathname),
    canonicalStorageQuery(url.search.slice(1)),
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
  const stringToSign = [
    ALGORITHM,
    amzDate,
    credentialScope,
    createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");
  const dateKey = hmac(Buffer.from(`AWS4${credentials.secretKey}`), dateStamp);
  const regionKey = hmac(dateKey, REGION);
  const serviceKey = hmac(regionKey, SERVICE);
  const signingKey = hmac(serviceKey, "aws4_request");
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    "x-amz-content-sha256": payloadHash,
    "x-amz-date": amzDate,
    authorization:
      `${ALGORITHM} Credential=${credentials.accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
