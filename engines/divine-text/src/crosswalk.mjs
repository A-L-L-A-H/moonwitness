import fs from 'node:fs/promises';
import path from 'node:path';
import { identityStatus } from './claims.mjs';

const CROSSWALK_DIR = 'data/crosswalk';

export { identityStatus }; // Preserve old export

async function ensureDir(root) {
  const dir = path.join(root, CROSSWALK_DIR);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (e) {
    if (e.code !== 'EEXIST') throw e;
  }
  return dir;
}

export async function saveLink(root, sourceA, sourceB, payload) {
  const dir = await ensureDir(root);
  const linkId = `${sourceA.replace(/[^a-zA-Z0-9_]/g, '')}__TO__${sourceB.replace(/[^a-zA-Z0-9_]/g, '')}`;
  const filePath = path.join(dir, 'links.json');
  
  let currentLinks = [];
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    currentLinks = JSON.parse(txt);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }

  // Check if link already exists
  const existingIndex = currentLinks.findIndex(l => (l.sourceA === sourceA && l.sourceB === sourceB) || (l.sourceA === sourceB && l.sourceB === sourceA));
  
  const linkData = {
    sourceA,
    sourceB,
    relationship: payload.relationship || 'UNKNOWN',
    notes: payload.notes || '',
    timestamp: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    currentLinks[existingIndex] = linkData;
  } else {
    currentLinks.push(linkData);
  }

  await fs.writeFile(filePath, JSON.stringify(currentLinks, null, 2), 'utf8');
  return linkData;
}

export async function getLinks(root) {
  const dir = await ensureDir(root);
  const filePath = path.join(dir, 'links.json');
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    return JSON.parse(txt);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    return [];
  }
}

export async function arbitrateLink(root, sourceA, sourceB) {
  const links = await getLinks(root);
  const linkIndex = links.findIndex(l => (l.sourceA === sourceA && l.sourceB === sourceB) || (l.sourceA === sourceB && l.sourceB === sourceA));
  
  if (linkIndex === -1) throw new Error('Link not found');
  const link = links[linkIndex];

  // Helper to fetch verse text (simplified fallback if corpus loading is too complex for this demo)
  // In a real scenario we'd load the JSON. For now we will instruct AI to resolve based on known IDs.
  // We can pass the IDs and prompt the AI to use its pre-trained knowledge if the text is not directly passed.
  
  const { askAI } = await import('./ai-providers.mjs');
  
  const prompt = `You are the AI Arbiter, a highly objective academic scholar of Abrahamic texts.
Two verses have been linked by a researcher as a potential contradiction or theological contrast:
Verse A: ${link.sourceA}
Verse B: ${link.sourceB}

Researcher Notes: "${link.notes}"

Your task is to provide a neutral, scholarly resolution to this apparent collision. 
Format your response in Markdown:
1. Define the apparent contradiction.
2. Provide historical, linguistic, or contextual analysis.
3. Conclude whether it is a genuine historical collision, a translation artifact, or a difference in theological perspective.`;

  let report = '';
  try {
    const aiResponse = await askAI(prompt);
    if (aiResponse.status === 'DISABLED' || !aiResponse.text) throw new Error('Disabled');
    report = aiResponse.text;
  } catch (e) {
    report = `**Mock Arbitration Report**\n\n1. **Apparent Contradiction**: The texts ${link.sourceA} and ${link.sourceB} appear to conflict regarding their theological assertions.\n2. **Contextual Analysis**: Upon linguistic review, the Hebrew/Arabic terms used carry nuanced meanings that depend heavily on their respective historical contexts (Asbabun Nuzul / Sitz im Leben).\n3. **Conclusion**: This is likely a difference in theological perspective rather than a strict historical collision.`;
  }

  link.arbitration_report = report;
  links[linkIndex] = link;
  
  const dir = await ensureDir(root);
  const filePath = path.join(dir, 'links.json');
  await fs.writeFile(filePath, JSON.stringify(links, null, 2), 'utf8');
  
  return report;
}
