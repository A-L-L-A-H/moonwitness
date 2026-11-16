import fs from 'node:fs/promises';
import path from 'node:path';

export async function readBook(root, sourceId, bookId, quranData) {
  if (sourceId === 'quran') {
    const targetSurah = Number(bookId.split(':')[0]);
    if (!targetSurah || isNaN(targetSurah)) throw new Error("Please select a specific Surah");
    const verses = [];
    for (const ayah of quranData) {
      if (ayah.surah === targetSurah) {
        verses.push({ verse_num: ayah.ayah, text: ayah.text_uthmani });
      }
    }
    return { book: bookId, chapters: [{ chapter_num: targetSurah, verses }] };
  }

  const filePath = path.join(root, 'data', 'corpora', sourceId, 'raw', `${bookId}.json`);
  let data;
  try {
    data = JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Failed to read ${sourceId}/${bookId}: ${err.message}`);
  }

  if (sourceId === 'torah' || sourceId === 'psalms' || sourceId === 'prophets') {
    // Sefaria format
    // data.text is an array of chapters, which is an array of verses (strings)
    const chapters = [];
    if (Array.isArray(data.text)) {
      data.text.forEach((chap, cIdx) => {
        const verses = [];
        if (Array.isArray(chap)) {
          chap.forEach((verse, vIdx) => {
            verses.push({ verse_num: vIdx + 1, text: verse.replace(/<[^>]*>?/gm, '') }); // strip basic HTML tags
          });
        } else if (typeof chap === 'string') {
          verses.push({ verse_num: 1, text: chap.replace(/<[^>]*>?/gm, '') });
        }
        chapters.push({ chapter_num: cIdx + 1, verses });
      });
    }
    return { book: bookId, chapters };
  }

  if (sourceId === 'gospels' || sourceId === 'epistles') {
    // KJV format
    // data.chapters[].verses[].number, text
    const chapters = data.chapters.map(c => ({
      chapter_num: c.chapter,
      verses: c.verses.map(v => ({ verse_num: v.number, text: v.text }))
    }));
    return { book: data.englishName || bookId, chapters };
  }

  if (sourceId === 'hadith') {
    // Hadith JSON v1.2.0 format
    // data.hadiths[]
    if (data.hadiths && Array.isArray(data.hadiths)) {
      const verses = data.hadiths.map(h => ({
        verse_num: h.hadithnumber || h.arabicnumber,
        text: h.text_en || h.text_ar || 'No text'
      }));
      return { book: data.metadata?.english?.title || bookId, chapters: [{ chapter_num: 1, verses }] };
    }
  }

  throw new Error(`Unsupported format for source ${sourceId}`);
}
