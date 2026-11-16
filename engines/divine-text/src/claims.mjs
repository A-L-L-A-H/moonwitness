import fs from 'node:fs/promises';
import path from 'node:path';

async function ensureDir(root) {
  const dir = path.join(root, 'data', 'claims');
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function getClaims(root) {
  const dir = await ensureDir(root);
  const file = path.join(dir, 'user_claims.json');
  try {
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch(e) {
    return [];
  }
}

export async function saveClaim(root, claimData) {
  const claims = await getClaims(root);
  if (claimData.id) {
    const idx = claims.findIndex(c => c.id === claimData.id);
    if (idx >= 0) claims[idx] = { ...claims[idx], ...claimData };
    else claims.push(claimData);
  } else {
    claimData.id = 'CLAIM-' + Date.now();
    claimData.evidence = [];
    claims.push(claimData);
  }
  
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'user_claims.json'), JSON.stringify(claims, null, 2));
  return claimData;
}

export async function attachVerseToClaim(root, claimId, verseData) {
  const claims = await getClaims(root);
  const idx = claims.findIndex(c => c.id === claimId);
  if (idx === -1) throw new Error('Claim not found');
  
  claims[idx].evidence = claims[idx].evidence || [];
  claims[idx].evidence.push(verseData);
  
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'user_claims.json'), JSON.stringify(claims, null, 2));
  return claims[idx];
}

export async function deleteClaim(root, claimId) {
  let claims = await getClaims(root);
  const initialLength = claims.length;
  claims = claims.filter(c => c.id !== claimId);
  
  if (claims.length === initialLength) throw new Error('Claim not found');
  
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'user_claims.json'), JSON.stringify(claims, null, 2));
  return { success: true };
}

export async function detachVerseFromClaim(root, claimId, verseId) {
  const claims = await getClaims(root);
  const idx = claims.findIndex(c => c.id === claimId);
  if (idx === -1) throw new Error('Claim not found');
  
  if (!claims[idx].evidence) return claims[idx];
  
  claims[idx].evidence = claims[idx].evidence.filter(e => {
    const eId = `${e.sourceId}_${e.bookId}_${e.chapterNum}_${e.verseNum}`;
    return eId !== verseId;
  });
  
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'user_claims.json'), JSON.stringify(claims, null, 2));
  return claims[idx];
}

export async function redTeamClaim(root, claimId) {
  const claims = await getClaims(root);
  const idx = claims.findIndex(c => c.id === claimId);
  if (idx === -1) throw new Error('Claim not found');
  const claim = claims[idx];
  
  const { askAI } = await import('./ai-providers.mjs');
  const prompt = `You are an adversarial Theological Peer-Reviewer (Devil's Advocate).
Your task is to RED-TEAM the following theological claim and its supporting evidence.
Be extremely critical, academic, and ruthless in finding logical fallacies, historical gaps, and biased interpretations.

Claim Title: ${claim.title}
Claim Description: ${claim.description}

Attached Evidence:
${(claim.evidence || []).map((e) => `- [${e.type}] ${e.sourceId} ${e.bookId} ${e.chapterNum}:${e.verseNum} : "${e.text}"`).join('\n')}

Format your response in Markdown:
1. **Core Vulnerability**: The main logical or historical flaw in the claim.
2. **Evidence Critique**: A ruthless takedown of the provided evidence (are they taken out of context? from late sources? contradicting each other?).
3. **The Adversarial Rebuttal**: A strong counter-argument from an opposing theological or secular paradigm.`;

  let report = '';
  try {
    const aiResponse = await askAI(prompt);
    if (aiResponse.status === 'DISABLED' || !aiResponse.text) throw new Error('Disabled');
    report = aiResponse.text;
  } catch (e) {
    report = `**Mock Red Team Report**\n\n1. **Core Vulnerability**: The claim relies on circular reasoning and assumes its own axioms.\n2. **Evidence Critique**: The evidence is sparse and heavily dependent on texts written centuries after the events.\n3. **The Adversarial Rebuttal**: A secular historian would argue that the texts reflect later communal theology rather than historical reality.`;
  }

  claim.redTeamReport = report;
  claims[idx] = claim;
  
  const dir = await ensureDir(root);
  await fs.writeFile(path.join(dir, 'user_claims.json'), JSON.stringify(claims, null, 2));
  return report;
}
