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
 * @param allWords - All words from database across all chapters with chapter info
 * @returns Information about duplicate occurrences
 */
export const detectDuplicateWord = (
  currentChapterId: string,
  currentWord: string,
  allWords: Array<{ word: string; chapterId: string; chapterTitle: string; wordId: string }> = []
): DuplicateInfo => {
  const normalizedCurrentWord = normalizeWord(currentWord);
  const occurrences: WordOccurrence[] = [];

  // Search through all words
  allWords.forEach(wordData => {
    const normalizedWord = normalizeWord(wordData.word);
    if (normalizedWord === normalizedCurrentWord) {
      occurrences.push({
        chapterId: wordData.chapterId,
        chapterTitle: wordData.chapterTitle,
        wordId: wordData.wordId
      });
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
 * @param currentWords - Current chapter's words
 * @param allWords - All words from database across all chapters with chapter info
 * @returns Map of word IDs to their duplicate info
 */
export const getAllDuplicatesInChapter = (
  chapterId: string,
  currentWords: Word[] = [],
  allWords: Array<{ word: string; chapterId: string; chapterTitle: string; wordId: string }> = []
): Map<string, DuplicateInfo> => {
  const duplicatesMap = new Map<string, DuplicateInfo>();

  currentWords.forEach(word => {
    const duplicateInfo = detectDuplicateWord(chapterId, word.word, allWords);
    if (duplicateInfo.isDuplicate) {
      duplicatesMap.set(word.id, duplicateInfo);
    }
  });

  return duplicatesMap;
};
