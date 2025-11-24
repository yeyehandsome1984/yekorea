
interface WordMeaningData {
  englishMeaning: string;
  koreanMeaning: string;
  pronunciation: string;
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
 * Fetches word meaning from Gemini API
 */
export const fetchWordMeaningFromApi = async (word: string, apiKey: string): Promise<WordMeaningData> => {
  const prompt = `Provide information about the Korean word "${word}" in this exact format:

Word: ${word}

English Meaning: [Provide a concise English definition in 1-2 lines]

Korean Meaning: [Provide a Korean language definition/explanation in 1-2 lines]

Pronunciation: [Provide Korean hangul pronunciation guide]

Example Korean: [Provide one example sentence in Korean using this word]

Example English: [Provide English translation of the example sentence]

Keep all responses brief and concise.`;
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  const data = await response.json();
  
  if (data.error) {
    console.error("Gemini API error:", data.error);
    throw new Error(data.error.message || 'Failed to get meaning');
  }
  
  const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  console.log("Raw API response:", responseText);
  
  // Parse the response text to extract the relevant parts
  const englishMeaningMatch = responseText.match(/English Meaning:\s*(.*?)(?=\n|$)/);
  const englishMeaning = englishMeaningMatch?.[1]?.trim() || 'No meaning found';
  
  const koreanMeaningMatch = responseText.match(/Korean Meaning:\s*(.*?)(?=\n|$)/);
  const koreanMeaning = koreanMeaningMatch?.[1]?.trim() || 'No Korean meaning found';
  
  const pronunciationMatch = responseText.match(/Pronunciation:\s*(.*?)(?=\n|$)/);
  const pronunciation = pronunciationMatch?.[1]?.trim() || '';
  
  const exampleKoreanMatch = responseText.match(/Example Korean:\s*(.*?)(?=\n|$)/);
  const exampleKorean = exampleKoreanMatch?.[1]?.trim() || '';
  
  const exampleEnglishMatch = responseText.match(/Example English:\s*(.*?)(?=\n|$)/);
  const exampleEnglish = exampleEnglishMatch?.[1]?.trim() || '';
  
  const parsedData = {
    englishMeaning,
    koreanMeaning,
    pronunciation,
    exampleKorean,
    exampleEnglish
  };

  console.log("Parsed data:", parsedData);

  // Validate parsed data before returning
  if (!isValidWordMeaningData(parsedData)) {
    throw new Error('Invalid data structure received from API');
  }

  return parsedData;
};
