import fs from 'node:fs/promises';
import path from 'node:path';

export async function globalSearch(root, query, limit = 50) {
  if (!query || query.trim() === '') return [];
  
  let q = query.toLowerCase().trim();
  let searchRegex = null;
  
  try {
    const { getEntities } = await import('./entities.mjs');
    const entities = await getEntities(root);
    for (const ent of entities) {
      if (ent.terms && ent.terms.some(t => t.toLowerCase() === q)) {
        const escapedTerms = ent.terms.map(t => t.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'));
        searchRegex = new RegExp(`\\\\b(${escapedTerms.join('|')})\\\\b`, 'i');
        break;
      }
    }
  } catch(e) {}
  
  if (!searchRegex) {
    searchRegex = new RegExp(q.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'), 'i');
  }

  const corporaDir = path.join(root, 'data', 'corpora');
  let registry = { sources: [] };
  
  try {
    const regTxt = await fs.readFile(path.join(corporaDir, 'registry.json'), 'utf8');
    registry = JSON.parse(regTxt);
  } catch(e) {
    console.error('Failed to read registry.json for search', e);
    return [];
  }

  const results = [];
  
  for (const source of registry.sources) {
    if (results.length >= limit) break;
    
    try {
      const srcTxt = await fs.readFile(path.join(corporaDir, `${source.id}.json`), 'utf8');
      const corpusData = JSON.parse(srcTxt);
      
      for (const book of corpusData.books || []) {
        if (results.length >= limit) break;
        
        for (const chapter of book.chapters || []) {
          if (results.length >= limit) break;
          
          for (const verse of chapter.verses || []) {
            if (results.length >= limit) break;
            
            const textToSearch = (verse.text_uthmani || verse.text || '');
            const translationToSearch = (verse.translation || '');
            
            if (searchRegex.test(textToSearch) || searchRegex.test(translationToSearch)) {
              results.push({
                sourceId: source.id,
                sourceName: source.name,
                bookId: book.id,
                bookName: book.title || book.name || book.id,
                chapterNum: chapter.chapter_num,
                verseNum: verse.verse_num,
                text: verse.text_uthmani || verse.text || '',
                translation: verse.translation || ''
              });
            }
          }
        }
      }
    } catch(e) {
      console.warn(`Skipping ${source.id} in search: ${e.message}`);
    }
  }

  return results;
}
