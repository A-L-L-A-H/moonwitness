import fs from 'node:fs/promises';
import path from 'node:path';

export async function aggregateScores(root) {
  const dir = path.join(root, 'data', 'annotations');
  let files = [];
  try {
    files = await fs.readdir(dir);
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }

  const result = { totalBooksScored: 0, sources: {} };

  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const data = JSON.parse(await fs.readFile(path.join(dir, file), 'utf8'));
    
    // Parse the safeSource and safeBook from the filename, but we can also extract from verseId
    for (const [verseId, anno] of Object.entries(data)) {
      if (!anno.score || !anno.status || anno.status !== 'Verified') continue;
      
      const parts = verseId.split('_');
      // Format is sourceId_bookId_chapterNum_verseNum
      // BUT sourceId and bookId can have underscores? Actually, no, because we used safeSource and safeBook.
      // Wait, verseId was constructed in UI: `${sourceId}_${bookId}_${chapterNum}_${verse.verse_num}`
      // This means splitting by '_' might be tricky if bookId has spaces or colons.
      // However, we just need the source, book, chapter, verse.
      const source = parts[0];
      const verseNum = parts.pop();
      const chapterNum = parts.pop();
      const book = parts.slice(1).join('_'); // the rest is bookId

      if (!result.sources[source]) result.sources[source] = { books: {}, aggregatedScore: 0 };
      if (!result.sources[source].books[book]) {
        result.sources[source].books[book] = { chapters: {}, aggregatedScore: 0 };
        result.totalBooksScored++;
      }
      if (!result.sources[source].books[book].chapters[chapterNum]) {
        result.sources[source].books[book].chapters[chapterNum] = { verses: {}, aggregatedScore: 0 };
      }

      const dims = ['sourceQuality', 'transmission', 'proximity', 'corroboration', 'interpretationGap'];
      let total = 0;
      for (const d of dims) total += (anno.score[d] || 0);

      result.sources[source].books[book].chapters[chapterNum].verses[verseNum] = {
        score: anno.score,
        total
      };
    }
  }

  // Aggregate upwards
  for (const [source, sData] of Object.entries(result.sources)) {
    let sourceScoreSum = 0;
    let sourceBookCount = 0;

    for (const [book, bData] of Object.entries(sData.books)) {
      let bookScoreSum = 0;
      let bookChapCount = 0;

      for (const [chap, cData] of Object.entries(bData.chapters)) {
        let chapScoreSum = 0;
        let chapVerseCount = 0;

        for (const [verse, vData] of Object.entries(cData.verses)) {
          chapScoreSum += vData.total;
          chapVerseCount++;
        }

        cData.aggregatedScore = chapVerseCount > 0 ? Math.round(chapScoreSum / chapVerseCount) : 0;
        bookScoreSum += cData.aggregatedScore;
        bookChapCount++;
      }

      bData.aggregatedScore = bookChapCount > 0 ? Math.round(bookScoreSum / bookChapCount) : 0;
      sourceScoreSum += bData.aggregatedScore;
      sourceBookCount++;
    }

    sData.aggregatedScore = sourceBookCount > 0 ? Math.round(sourceScoreSum / sourceBookCount) : 0;
  }

  return result;
}
