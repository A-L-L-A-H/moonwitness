import fs from 'node:fs';
import crypto from 'node:crypto';

export function sha256File(path) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(path));
  return hash.digest('hex');
}

export function sha256Text(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

export function fileMeta(path) {
  const stat = fs.statSync(path);
  return { path, bytes: stat.size, sha256: sha256File(path) };
}
