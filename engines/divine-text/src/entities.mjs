import fs from 'node:fs/promises';
import path from 'node:path';

async function ensureDir(root) {
  const dir = path.join(root, 'data');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function getEntities(root) {
  const dir = await ensureDir(root);
  const file = path.join(dir, 'entities.json');
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch(e) {
    return [];
  }
}

export async function saveEntity(root, entityData) {
  const entities = await getEntities(root);
  if (entityData.id) {
    const idx = entities.findIndex(e => e.id === entityData.id);
    if (idx >= 0) entities[idx] = { ...entities[idx], ...entityData };
    else entities.push(entityData);
  } else {
    entityData.id = 'ENTITY-' + Date.now();
    entities.push(entityData);
  }
  
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'entities.json'), JSON.stringify(entities, null, 2));
  return entityData;
}

export async function deleteEntity(root, entityId) {
  let entities = await getEntities(root);
  entities = entities.filter(e => e.id !== entityId);
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'entities.json'), JSON.stringify(entities, null, 2));
  return { success: true };
}
