import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DOCTOR_EXIT_OK,
  DOCTOR_EXIT_RUNTIME,
  DOCTOR_EXIT_USAGE,
  DoctorUsageError,
  parseDoctorArgs,
  redactSecrets,
  runDoctor,
} from "../doctor-cli.js";

const FIXTURE_PATH = fileURLToPath(new URL("./fixtures/doctor-models.ts", import.meta.url));

function capture(): {
  io: { stdout: (t: string) => void; stderr: (t: string) => void };
  out: () => string;
  err: () => string;
} {
  let stdout = "";
  let stderr = "";
  return {
    io: {
      stdout: (text) => {
        stdout += text;
      },
      stderr: (text) => {
        stderr += text;
      },
    },
    out: () => stdout,
    err: () => stderr,
  };
}

describe("doctor CLI arguments and configuration", () => {
  it("parses valid arguments", () => {
    expect(parseDoctorArgs(["--models", "./m.ts", "--model", "a.b", "--json"])).toEqual({
      help: false,
      json: true,
      modules: ["./m.ts"],
      models: ["a.b"],
    });
  });

  it("rejects malformed arguments", () => {
    expect(() => parseDoctorArgs(["--bogus"])).toThrow(DoctorUsageError);
    expect(() => parseDoctorArgs(["--models"])).toThrow(DoctorUsageError);
    expect(() => parseDoctorArgs(["--models", "--json"])).toThrow(DoctorUsageError);
  });

  it("prints help with exit 0", async () => {
    const sink = capture();
    expect(await runDoctor(["--help"], {}, sink.io)).toBe(DOCTOR_EXIT_OK);
    expect(sink.out()).toContain("Exit codes");
  });

  it("exits 2 on malformed arguments", async () => {
    const sink = capture();
    expect(await runDoctor(["--nope"], { DATABASE_URL: "postgres://u:p@h/d" }, sink.io)).toBe(
      DOCTOR_EXIT_USAGE,
    );
    expect(sink.err()).toContain("Unknown argument");
  });

  it("exits 2 when DATABASE_URL is missing", async () => {
    const sink = capture();
    expect(await runDoctor(["--models", FIXTURE_PATH], {}, sink.io)).toBe(DOCTOR_EXIT_USAGE);
    expect(sink.err()).toContain("DATABASE_URL is required");
  });

  it("exits 2 and never falls back when DATABASE_URL is not PostgreSQL", async () => {
    const sink = capture();
    expect(
      await runDoctor(["--models", FIXTURE_PATH], { DATABASE_URL: "file:local.db" }, sink.io),
    ).toBe(DOCTOR_EXIT_USAGE);
    expect(sink.err()).toContain("postgres://");
  });

  it("exits 2 when no models module is supplied", async () => {
    const sink = capture();
    expect(await runDoctor([], { DATABASE_URL: "postgres://u:p@h/d" }, sink.io)).toBe(
      DOCTOR_EXIT_USAGE,
    );
  });

  it("exits 3 on connection failure without leaking credentials", async () => {
    const sink = capture();
    const url = "postgres://doctoruser:s3cretpw@127.0.0.1:1/nodb?sslmode=disable";
    expect(
      await runDoctor(["--models", FIXTURE_PATH, "--json"], { DATABASE_URL: url }, sink.io),
    ).toBe(DOCTOR_EXIT_RUNTIME);
    expect(sink.err()).not.toContain("s3cretpw");
    expect(sink.err()).not.toContain("doctoruser");
    expect(sink.out()).toBe("");
  });

  it("redacts credentials and URLs", () => {
    const url = "postgres://bob:hunter2@db.example/app?password=qwerty";
    const text = redactSecrets(`failed ${url} for bob with hunter2 and qwerty`, url);
    expect(text).not.toMatch(/hunter2|qwerty|bob|db\.example/);
  });
});
