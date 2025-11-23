interface Word {
  id: string;
  word: string;
  [key: string]: any;
}

interface WordOccurrence {
  chapterId: string;
  chapterTitle: string;
  wordId: string;
}

interface DuplicateInfo {
  isDuplicate: boolean;
  occurrenceCount: number;
  otherChapters: { id: string; title: string }[];
}

// Normalize word for comparison
const normalizeWord = (word: string): string => {
  return word
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\w]/g, '')
    .trim();
};

/**
 * Detects duplicate words across all chapters
 * @param currentChapterId - The ID of the current chapter
 * @param currentWord - The word to check for duplicates
 * @returns Information about duplicate occurrences
 */
export const detectDuplicateWord = (
  currentChapterId: string,
  currentWord: string
): DuplicateInfo => {
  const normalizedCurrentWord = normalizeWord(currentWord);
  const occurrences: WordOccurrence[] = [];

  // Get all chapter IDs from localStorage
  const chaptersKey = 'lingualearn_chapters';
  const chaptersStr = localStorage.getItem(chaptersKey);
  
  if (!chaptersStr) {
    return {
      isDuplicate: false,
      occurrenceCount: 0,
      otherChapters: []
    };
  }

  let chapters: { id: string; title: string }[] = [];
  try {
    chapters = JSON.parse(chaptersStr);
  } catch (e) {
    console.error('Error parsing chapters:', e);
    return {
      isDuplicate: false,
      occurrenceCount: 0,
      otherChapters: []
    };
  }

  // Search through all chapters
  chapters.forEach(chapter => {
    const chapterDataStr = localStorage.getItem(`chapter_${chapter.id}`);
    if (!chapterDataStr) return;

    try {
      const chapterData = JSON.parse(chapterDataStr);
      const words: Word[] = chapterData.words || [];

      words.forEach(word => {
        const normalizedWord = normalizeWord(word.word);
        if (normalizedWord === normalizedCurrentWord) {
          occurrences.push({
            chapterId: chapter.id,
            chapterTitle: chapter.title,
            wordId: word.id
          });
        }
      });
    } catch (e) {
      console.error(`Error parsing chapter ${chapter.id}:`, e);
    }
  });

  // Filter out occurrences from the current chapter
  const otherChapterOccurrences = occurrences.filter(
    occ => occ.chapterId !== currentChapterId
  );

  const isDuplicate = occurrences.length > 1;
  const uniqueChapters = new Map<string, string>();
  
  otherChapterOccurrences.forEach(occ => {
    uniqueChapters.set(occ.chapterId, occ.chapterTitle);
  });

  const otherChapters = Array.from(uniqueChapters.entries()).map(([id, title]) => ({
    id,
    title
  }));

  return {
    isDuplicate,
    occurrenceCount: occurrences.length,
    otherChapters
  };
};

/**
 * Get all duplicate words in a chapter
 * @param chapterId - The ID of the chapter
 * @returns Map of word IDs to their duplicate info
 */
export const getAllDuplicatesInChapter = (
  chapterId: string
): Map<string, DuplicateInfo> => {
  const duplicatesMap = new Map<string, DuplicateInfo>();
  
  const chapterDataStr = localStorage.getItem(`chapter_${chapterId}`);
  if (!chapterDataStr) return duplicatesMap;

  try {
    const chapterData = JSON.parse(chapterDataStr);
    const words: Word[] = chapterData.words || [];

    words.forEach(word => {
      const duplicateInfo = detectDuplicateWord(chapterId, word.word);
      if (duplicateInfo.isDuplicate) {
        duplicatesMap.set(word.id, duplicateInfo);
      }
    });
  } catch (e) {
    console.error('Error getting duplicates:', e);
  }

  return duplicatesMap;
};
