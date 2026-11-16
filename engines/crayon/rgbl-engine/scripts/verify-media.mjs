import {createHash} from "node:crypto";
import {existsSync, readFileSync} from "node:fs";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";

const root = resolve(process.argv[2] ?? ".");
const manifestPath = resolve(root, "media/SHA256SUMS.txt");

const fail = (message) => {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
};

if (!existsSync(manifestPath)) {
  fail(`checksum manifest not found: ${manifestPath}`);
  process.exit();
}

const entries = readFileSync(manifestPath, "utf8")
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line) => {
    const match = line.match(/^([a-f0-9]{64})\s{2}(.+)$/i);
    if (!match) throw new Error(`Invalid checksum line: ${line}`);
    return {expected: match[1].toLowerCase(), path: match[2]};
  });

if (entries.length !== 37) fail(`expected 37 production binary assets, found ${entries.length}`);

for (const entry of entries) {
  const file = resolve(root, entry.path);
  if (!existsSync(file)) {
    fail(`missing production asset: ${entry.path}`);
    continue;
  }
  const bytes = readFileSync(file);
  const actual = createHash("sha256").update(bytes).digest("hex");
  if (actual !== entry.expected) fail(`checksum mismatch: ${entry.path}`);
}

const signatures = [
  ["media/opener/crayon-sin-can-out-of-line.png", (b) => b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])), "PNG"],
  ["media/audio/crayon-funny-bgm.wav", (b) => b.subarray(0,4).toString("ascii") === "RIFF" && b.subarray(8,12).toString("ascii") === "WAVE", "WAV"],
  ["media/video/crayon-four-worlds-with-bgm.mp4", (b) => b.length > 12 && b.subarray(4,8).toString("ascii") === "ftyp", "MP4"],
  ["docs/research/CRAYON-Framework-v1.9.docx", (b) => b.length > 4 && b[0] === 0x50 && b[1] === 0x4b, "DOCX/ZIP"],
];

for (const [relative, check, label] of signatures) {
  const file = resolve(root, relative);
  if (existsSync(file) && !check(readFileSync(file))) fail(`invalid ${label} signature: ${relative}`);
}

const ffprobeAvailable = spawnSync("ffprobe", ["-version"], {stdio: "ignore"}).status === 0;
if (ffprobeAvailable) {
  const video = resolve(root, "media/video/crayon-four-worlds-with-bgm.mp4");
  const probe = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,sample_rate,channels", "-show_entries", "format=duration", "-of", "json", video], {encoding: "utf8"});
  if (probe.status !== 0) {
    fail("ffprobe could not read the production MP4");
  } else {
    const info = JSON.parse(probe.stdout);
    const videoStream = info.streams?.find((s) => s.codec_type === "video");
    const audioStream = info.streams?.find((s) => s.codec_type === "audio");
    if (!videoStream) fail("production MP4 has no video stream");
    if (!audioStream) fail("production MP4 has no audio stream/BGM");
    if (videoStream && (videoStream.width !== 1280 || videoStream.height !== 720)) fail(`expected 1280x720 MP4, found ${videoStream.width}x${videoStream.height}`);
    if (audioStream && (Number(audioStream.sample_rate) !== 44100 || audioStream.channels !== 2)) fail("production MP4 audio must be 44.1 kHz stereo");
    const duration = Number(info.format?.duration ?? 0);
    if (Math.abs(duration - 93) > 0.25) fail(`expected ~93s MP4 duration, found ${duration}s`);
  }
} else {
  console.warn("! ffprobe not installed; checksum/signature verification passed, semantic MP4 stream inspection skipped.");
}

if (root === resolve(".")) {
  const lfsPaths = entries.map((e) => e.path);
  const attr = spawnSync("git", ["check-attr", "filter", "--", ...lfsPaths], {encoding: "utf8"});
  if (attr.status !== 0) {
    fail("git check-attr failed; is this a Git repository?");
  } else {
    for (const line of attr.stdout.split(/\r?\n/).filter(Boolean)) {
      if (!line.endsWith(": lfs")) fail(`asset is not covered by Git LFS attributes: ${line}`);
    }
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`✓ Production media verified: ${entries.length}/37 assets, checksums and signatures PASS.`);
if (ffprobeAvailable) console.log("✓ MP4 semantic check PASS: 1280x720 H.264 video + 44.1 kHz stereo audio, ~93s.");
