
export interface WordMeaningData {
  englishMeaning: string;
  koreanMeaning: string;
  pronunciation: string;
  hanja?: string;
  exampleKorean: string;
  exampleEnglish: string;
}

/**
 * Validates word meaning data structure
 */
const isValidWordMeaningData = (data: any): data is WordMeaningData => {
  try {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.englishMeaning === 'string' &&
      typeof data.koreanMeaning === 'string' &&
      typeof data.pronunciation === 'string' &&
      typeof data.exampleKorean === 'string' &&
      typeof data.exampleEnglish === 'string' &&
      data.englishMeaning.length > 0 &&
      data.koreanMeaning.length > 0
    );
  } catch (error) {
    console.error("Error validating word meaning data:", error);
    return false;
  }
};

/**
 * Retrieves word meaning from localStorage or returns null if not found
 */
export const getStoredWordMeaning = (word: string): WordMeaningData | null => {
  try {
    const cachedMeaning = localStorage.getItem(`word_meaning_${word.toLowerCase()}`);
    if (cachedMeaning) {
      const parsedData = JSON.parse(cachedMeaning);
      
      // Validate the cached data structure
      if (isValidWordMeaningData(parsedData)) {
        return parsedData;
      } else {
        console.warn("Invalid cached data structure for word:", word, "Data:", parsedData);
        // Remove corrupted cache
        localStorage.removeItem(`word_meaning_${word.toLowerCase()}`);
        return null;
      }
    }
  } catch (error) {
    console.error("Error retrieving or parsing cached meaning:", error);
    // Clear potentially corrupted cache entry
    try {
      localStorage.removeItem(`word_meaning_${word.toLowerCase()}`);
    } catch (clearError) {
      console.error("Error clearing corrupted cache:", clearError);
    }
  }
  return null;
};

/**
 * Stores word meaning in localStorage
 */
export const storeWordMeaning = (word: string, meaningData: WordMeaningData): void => {
  try {
    // Validate data before storing
    if (!isValidWordMeaningData(meaningData)) {
      console.error("Invalid word meaning data, not storing:", meaningData);
      return;
    }

    localStorage.setItem(`word_meaning_${word.toLowerCase()}`, JSON.stringify(meaningData));
    console.log("Saved meaning to localStorage for:", word);
  } catch (error) {
    console.error("Error saving word meaning to localStorage:", error);
  }
};

/**
 * Fetches word meaning from Lovable AI via edge function
 */
export const fetchWordMeaningFromApi = async (word: string): Promise<WordMeaningData> => {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
  const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  const response = await fetch(`${SUPABASE_URL}/functions/v1/fetch-word-meaning`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ word })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to fetch word meaning');
  }

  const data = await response.json();

  // Validate parsed data before returning
  if (!isValidWordMeaningData(data)) {
    throw new Error('Invalid data structure received from API');
  }

  return data;
};
