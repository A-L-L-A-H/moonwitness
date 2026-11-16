import fs from 'node:fs/promises';
import path from 'node:path';

export async function loadAnnotations(root, sourceId, bookId) {
  const safeSource = sourceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeBook = bookId.replace(/[^a-zA-Z0-9_-]/g, '');
  const p = path.join(root, 'data', 'annotations', `${safeSource}_${safeBook}.json`);
  
  try {
    const data = await fs.readFile(p, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return {}; // Return empty if not exists
    throw err;
  }
}

export async function saveAnnotation(root, sourceId, bookId, verseId, payload) {
  const safeSource = sourceId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safeBook = bookId.replace(/[^a-zA-Z0-9_-]/g, '');
  const p = path.join(root, 'data', 'annotations', `${safeSource}_${safeBook}.json`);
  
  let existing = {};
  try {
    existing = JSON.parse(await fs.readFile(p, 'utf8'));
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // Update verse
  existing[verseId] = {
    ...existing[verseId],
    ...payload,
    updatedAt: new Date().toISOString()
  };

  // Ensure directory exists
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, JSON.stringify(existing, null, 2));

  return existing[verseId];
}
