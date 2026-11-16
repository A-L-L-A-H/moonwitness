import fs from 'node:fs/promises';
import path from 'node:path';
import { askAI } from './ai-providers.mjs';

export async function generatePaper(root, topic = 'Global Corpus Synthesis') {
  const dir = path.join(root, 'data', 'annotations');
  let files = [];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  let aggregatedText = '';
  let count = 0;

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
    
    for (const [verseId, anno] of Object.entries(data)) {
      // Only include verses that have some CRAYON text
      if (!anno.tafsir_R && !anno.tafsir_G && !anno.tafsir_B && !anno.tafsir_L) continue;
      
      const scoreTotal = anno.score ? Object.values(anno.score).reduce((a, b) => a + Number(b), 0) : 'N/A';
      
      aggregatedText += `
### Verse: ${verseId}
- Total Score: ${scoreTotal}/100
- FAKTA (R): ${anno.tafsir_R || 'None'}
- KONTEKS (G): ${anno.tafsir_G || 'None'}
- MAKNA (B): ${anno.tafsir_B || 'None'}
- HIKMAH (L): ${anno.tafsir_L || 'None'}
- CAUTION: ${anno.salah_tafsir || 'None'}
`;
      count++;
    }
  }

  if (count === 0) {
    throw new Error('No CRAYON annotations found in the database. Please annotate some verses first.');
  }

  const prompt = `You are a world-class academic researcher in Abrahamic Source-Criticism.
I will provide you with a raw dataset of ${count} verses analyzed using the CRAYON Epistemic Framework (Fakta, Konteks, Makna, Hikmah).

Your task is to synthesize this raw data into a brilliant, cohesive academic research paper formatted in Markdown.
The user requested the topic: "${topic}"

Structure the paper with:
# Title
## Abstract
## 1. Methodology (Mention CRAYON and 5-Dimension Scoring)
## 2. Textual and Historical Evidence (Synthesize the 'FAKTA' and 'KONTEKS' fields)
## 3. Exegetical and Philosophical Meaning (Synthesize the 'MAKNA' and 'HIKMAH' fields)
## 4. Cautionary Notes (Synthesize any 'CAUTION/Salah Tafsir' guardrails)
## 5. Conclusion

Do NOT just list the verses. Synthesize them into flowing, scholarly prose.

RAW DATA:
${aggregatedText.substring(0, 15000)} // Limit to 15k chars to avoid token limits if too massive.
`;

  try {
    const aiResponse = await askAI(prompt);
    if (aiResponse.status === 'DISABLED' || !aiResponse.text) {
      throw new Error('AI is disabled or empty');
    }
    return aiResponse.text;
  } catch (e) {
    console.warn('AI Paper Generation failed, using mock:', e.message);
    
    // Fallback Mock Markdown Paper
    return `# Research Paper: ${topic}

## Abstract
This paper synthesizes ${count} annotated verses using the CRAYON epistemic framework and the Bottom-Up 5-Dimension evidentiary scoring model. The study explicitly separates historical transmission from theological claims to provide a robust, bias-free analysis.

## 1. Methodology
The Divine Text Verification engine utilizes the CRAYON framework to isolate textual data into four distinct layers: Information (R), Knowledge (G), Understanding (B), and Wisdom (L). Furthermore, a bottom-up scoring model evaluates Source Quality, Transmission, Proximity, Corroboration, and Interpretation Gap.

## 2. Textual and Historical Evidence (Fakta & Konteks)
Based on the ${count} verses analyzed, the material provenance and transmission lines show significant textual stability in certain corpora, while others exhibit higher interpretation gaps due to repeated translations.

## 3. Exegetical and Philosophical Meaning (Makna & Hikmah)
The core theological alignment found across the annotated verses emphasizes universal justice, monotheism, and moral uprightness. The hikmah (wisdom) derived is consistently applicable to modern societal frameworks.

## 4. Cautionary Notes (Salah Tafsir)
Several guardrails were noted during the annotation phase, particularly warning against hyper-literalism devoid of historical context (Asbabun Nuzul).

## 5. Conclusion
The utilization of the CRAYON framework has successfully demystified the text, proving that layered epistemic analysis yields far superior comparative results than monolithic theological reading.

---
*Generated automatically by Divine Text Verification Engine v7.0.0 (Mock Fallback)*
`;
  }
}
