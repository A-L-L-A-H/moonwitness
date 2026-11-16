import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const KERNEL_ROOT = path.join(process.cwd(), "packages", "kernel", "src");

const FORBIDDEN_TERMS = [
  "react",
  "css",
  "browser",
  "screen",
  "button",
  "card",
  "modal",
  "hover",
  "click",
  "pixel",
  "color",
];

const FORBIDDEN_DOMAIN_TERMS = [
  "banking",
  "bank",
  "invoice",
  "email",
  "erp",
  "server",
];

const FORBIDDEN_IMPORT_PATTERNS = [
  { label: "react dependency", pattern: /from\s+["']react(?:-dom)?["']/i },
  { label: "physics dependency", pattern: /from\s+["'][^"']*physics[^"']*["']/i },
  { label: "rir dependency", pattern: /from\s+["'][^"']*rir[^"']*["']/i },
  { label: "renderer dependency", pattern: /from\s+["'][^"']*renderer[^"']*["']/i },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findViolations(source) {
  const violations = [];

  for (const term of [...FORBIDDEN_TERMS, ...FORBIDDEN_DOMAIN_TERMS]) {
    const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
    if (pattern.test(source)) {
      violations.push(`forbidden term: ${term}`);
    }
  }

  for (const item of FORBIDDEN_IMPORT_PATTERNS) {
    if (item.pattern.test(source)) {
      violations.push(`forbidden import: ${item.label}`);
    }
  }

  return violations;
}

function listTypeScriptFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return listTypeScriptFiles(fullPath);
    }
    return entry.isFile() && entry.name.endsWith(".ts") ? [fullPath] : [];
  });
}

test("semantic kernel contains no UI/platform/domain leakage", () => {
  const violations = [];

  for (const file of listTypeScriptFiles(KERNEL_ROOT)) {
    const source = fs.readFileSync(file, "utf8");
    for (const violation of findViolations(source)) {
      violations.push(`${path.relative(process.cwd(), file)} — ${violation}`);
    }
  }

  assert.deepEqual(violations, []);
});

test("architecture guard detects a prohibited fixture", () => {
  const fixture = `
    import React from "react";
    const button = "button";
    const invoice = "domain-specific";
  `;

  const violations = findViolations(fixture);

  assert.equal(
    violations.some((violation) => violation.includes("forbidden term: react")),
    true,
  );
  assert.equal(
    violations.some((violation) => violation.includes("forbidden term: button")),
    true,
  );
  assert.equal(
    violations.some((violation) => violation.includes("forbidden term: invoice")),
    true,
  );
  assert.equal(
    violations.some((violation) => violation.includes("forbidden import: react dependency")),
    true,
  );
});
