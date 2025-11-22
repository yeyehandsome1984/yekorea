// Daily Revision Utilities
// Handles the generation of daily revision sessions based on user's learning history

import { useToast } from "@/hooks/use-toast";

export interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
  lastAttemptDate?: string;
  lastResult?: 'correct' | 'incorrect' | 'skipped';
  timeTaken?: number;
  isKnown?: boolean;
}

export interface RevisionSession {
  id: string;
  date: string;
  words: Word[];
  source: 'daily-revision' | 'challenging-words' | 'learning-plan' | 'smart-revision';
  completed: boolean;
  score?: number;
  results?: {
    correct: string[];
    incorrect: string[];
    skipped: string[];
    bookmarked: string[];
  };
  learningPlanInfo?: {
    planId: string;
    setIndex: number;
  };
}

// Function to generate a daily revision session
export const generateDailyRevisionSession = (): RevisionSession | null => {
  try {
    // Get all words that match our criteria from different sources
    const weakWords = collectWeakWords();
    
    if (weakWords.length === 0) {
      return null;
    }
    
    // Limit to ~50 words and shuffle
    const selectedWords = shuffleArray(weakWords).slice(0, 50);
    
    // Create a new session
    const session: RevisionSession = {
      id: `daily-revision-${Date.now()}`,
      date: new Date().toISOString(),
      words: selectedWords,
      source: 'daily-revision',
      completed: false,
    };
    
    // Save the session to localStorage
    saveRevisionSession(session);
    
    return session;
  } catch (error) {
    console.error("Error generating daily revision session:", error);
    return null;
  }
};

// Function to create a session from challenging words of a previous session
export const generateChallengingWordsSession = (sessionId: string): RevisionSession | null => {
  try {
    // Get the source session
    const sourceSession = getRevisionSession(sessionId);
    
    if (!sourceSession || !sourceSession.results) {
      return null;
    }
    
    // Get words that were incorrect, skipped, or bookmarked
    const challengingWordIds = [
      ...sourceSession.results.incorrect,
      ...sourceSession.results.skipped,
      ...sourceSession.results.bookmarked
    ];
    
    // Remove duplicates
    const uniqueWordIds = [...new Set(challengingWordIds)];
    
    if (uniqueWordIds.length === 0) {
      return null;
    }
    
    // Get the actual word objects
    const challengingWords = sourceSession.words.filter(word => 
      uniqueWordIds.includes(word.id)
    );
    
    // Create a new session
    const session: RevisionSession = {
      id: `challenging-words-${Date.now()}`,
      date: new Date().toISOString(),
      words: challengingWords,
      source: 'challenging-words',
      completed: false,
    };
    
    // Save the session to localStorage
    saveRevisionSession(session);
    
    return session;
  } catch (error) {
    console.error("Error generating challenging words session:", error);
    return null;
  }
};

// Update the collection of weak words to exclude known words
const collectWeakWords = (): Word[] => {
  const words: Word[] = [];
  const wordIds = new Set<string>();
  
  // Get words from flashcard history
  try {
    const flashcardHistoryStr = localStorage.getItem('flashcard_history');
    if (flashcardHistoryStr) {
      const flashcardHistory = JSON.parse(flashcardHistoryStr);
      
      flashcardHistory.forEach((attempt: any) => {
        // Include words that were marked as incorrect, skipped, or took too long
        // BUT exclude known words
        if (
          !attempt.word.isKnown && 
          (attempt.result === 'incorrect' || 
           attempt.result === 'skipped' || 
           attempt.timeTaken >= 15000)
        ) {
          if (!wordIds.has(attempt.wordId)) {
            wordIds.add(attempt.wordId);
            words.push({
              ...attempt.word,
              lastAttemptDate: attempt.date,
              lastResult: attempt.result,
              timeTaken: attempt.timeTaken
            });
          }
        }
      });
    }
  } catch (e) {
    console.error("Error parsing flashcard history:", e);
  }
  
  // Get words from quiz history (excluding known words)
  try {
    const quizHistoryStr = localStorage.getItem('quiz_history');
    if (quizHistoryStr) {
      const quizHistory = JSON.parse(quizHistoryStr);
      
      quizHistory.forEach((attempt: any) => {
        if (
          !attempt.word.isKnown && 
          (!attempt.correct || attempt.timeTaken >= 15000)
        ) {
          if (!wordIds.has(attempt.wordId)) {
            wordIds.add(attempt.wordId);
            words.push({
              ...attempt.word,
              lastAttemptDate: attempt.date,
              lastResult: attempt.correct ? 'correct' : 'incorrect',
              timeTaken: attempt.timeTaken
            });
          }
        }
      });
    }
  } catch (e) {
    console.error("Error parsing quiz history:", e);
  }
  
  // Get words from learning plans (excluding known words)
  try {
    const plansStr = localStorage.getItem('learning_plans');
    if (plansStr) {
      const plans = JSON.parse(plansStr);
      
      plans.forEach((plan: any) => {
        if (plan.sets) {
          plan.sets.forEach((set: any) => {
            if (set.unknownWordIds && set.unknownWordIds.length > 0) {
              set.words.forEach((word: any) => {
                if (
                  !word.isKnown && 
                  set.unknownWordIds.includes(word.id) && 
                  !wordIds.has(word.id)
                ) {
                  wordIds.add(word.id);
                  words.push({
                    ...word,
                    lastResult: 'incorrect'
                  });
                }
              });
            }
          });
        }
      });
    }
  } catch (e) {
    console.error("Error parsing learning plans:", e);
  }
  
  // If we still don't have enough words, add some from chapters (excluding known words)
  if (words.length < 50) {
    try {
      const keys = Object.keys(localStorage);
      const chapterKeys = keys.filter(key => key.startsWith('chapter_'));
      
      for (const key of chapterKeys) {
        const chapterData = JSON.parse(localStorage.getItem(key) || '{}');
        if (chapterData.words && Array.isArray(chapterData.words)) {
          chapterData.words.forEach((word: any) => {
            if (!word.isKnown && !wordIds.has(word.id)) {
              wordIds.add(word.id);
              words.push(word);
            }
          });
        }
      }
    } catch (e) {
      console.error("Error fetching additional words from chapters:", e);
    }
  }
  
  return words;
};

// Save a revision session to localStorage
export const saveRevisionSession = (session: RevisionSession): void => {
  try {
    // Get existing sessions
    const sessionsStr = localStorage.getItem('revision_sessions');
    const sessions = sessionsStr ? JSON.parse(sessionsStr) : [];
    
    // Add or update the session
    const existingIndex = sessions.findIndex((s: RevisionSession) => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    // Save back to localStorage
    localStorage.setItem('revision_sessions', JSON.stringify(sessions));
  } catch (e) {
    console.error("Error saving revision session:", e);
  }
};

// Get a revision session by ID
export const getRevisionSession = (sessionId: string): RevisionSession | null => {
  try {
    const sessionsStr = localStorage.getItem('revision_sessions');
    if (!sessionsStr) return null;
    
    const sessions = JSON.parse(sessionsStr);
    return sessions.find((session: RevisionSession) => session.id === sessionId) || null;
  } catch (e) {
    console.error("Error getting revision session:", e);
    return null;
  }
};

// Get today's revision session if it exists
export const getTodayRevisionSession = (): RevisionSession | null => {
  try {
    const sessionsStr = localStorage.getItem('revision_sessions');
    if (!sessionsStr) return null;
    
    const sessions = JSON.parse(sessionsStr);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Find a session created today
    return sessions.find((session: RevisionSession) => {
      const sessionDate = new Date(session.date).toISOString().split('T')[0];
      return sessionDate === today && session.source === 'daily-revision';
    }) || null;
  } catch (e) {
    console.error("Error getting today's revision session:", e);
    return null;
  }
};

// Shuffle array using Fisher-Yates algorithm
const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Save quiz results to the revision session
export const saveQuizResults = (
  sessionId: string, 
  score: number,
  results: {
    correct: string[];
    incorrect: string[];
    skipped: string[];
    bookmarked: string[];
  }
): void => {
  try {
    const session = getRevisionSession(sessionId);
    if (!session) return;
    
    // Update the session with results
    const updatedSession: RevisionSession = {
      ...session,
      completed: true,
      score,
      results
    };
    
    // Save the updated session
    saveRevisionSession(updatedSession);
    
    // Also update learning history
    updateLearningHistory(session, results);
  } catch (e) {
    console.error("Error saving quiz results:", e);
  }
};

// Update learning history with the quiz results
const updateLearningHistory = (
  session: RevisionSession,
  results: {
    correct: string[];
    incorrect: string[];
    skipped: string[];
    bookmarked: string[];
  }
): void => {
  try {
    // Update quiz history
    const quizHistoryStr = localStorage.getItem('quiz_history');
    const quizHistory = quizHistoryStr ? JSON.parse(quizHistoryStr) : [];
    
    // Add entries for correct words
    results.correct.forEach(wordId => {
      const word = session.words.find(w => w.id === wordId);
      if (word) {
        quizHistory.push({
          wordId,
          word,
          correct: true,
          date: new Date().toISOString(),
          timeTaken: 0, // We don't track time in this implementation
          source: session.source
        });
      }
    });
    
    // Add entries for incorrect words
    results.incorrect.forEach(wordId => {
      const word = session.words.find(w => w.id === wordId);
      if (word) {
        quizHistory.push({
          wordId,
          word,
          correct: false,
          date: new Date().toISOString(),
          timeTaken: 0,
          source: session.source
        });
      }
    });
    
    // Save updated history
    localStorage.setItem('quiz_history', JSON.stringify(quizHistory));
    
    // Update bookmarks
    results.bookmarked.forEach(wordId => {
      const word = session.words.find(w => w.id === wordId);
      if (word) {
        addWordToBookmarks(word, session.source);
      }
    });
  } catch (e) {
    console.error("Error updating learning history:", e);
  }
};

// Add a word to bookmarks with proper chapter information
const addWordToBookmarks = (word: Word, source: string): void => {
  try {
    const bookmarksStr = localStorage.getItem('bookmarked_words');
    const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
    
    // Determine the appropriate chapter name based on the source
    let chapterName = "Daily Revision";
    
    // If the word has an associated chapter (from chapter data), use that
    if (word.hasOwnProperty('chapter') && (word as any).chapter) {
      chapterName = (word as any).chapter;
    } else if (source === 'learning-plan') {
      chapterName = "Learning Plan";
    } else if (source === 'smart-revision') {
      chapterName = "Smart Revision";
    } else if (source === 'challenging-words') {
      chapterName = "Challenging Words";
    }
    
    // Check if word is already bookmarked
    const existingIndex = bookmarks.findIndex((bm: any) => bm.id === word.id);
    
    if (existingIndex >= 0) {
      // Update existing bookmark
      bookmarks[existingIndex] = {
        ...bookmarks[existingIndex],
        word: word.word,
        translation: word.definition,
        phonetic: word.phonetic,
        chapter: chapterName
      };
    } else {
      // Add new bookmark
      bookmarks.push({
        id: word.id,
        word: word.word,
        translation: word.definition,
        phonetic: word.phonetic,
        chapter: chapterName
      });
    }
    
    localStorage.setItem('bookmarked_words', JSON.stringify(bookmarks));
  } catch (e) {
    console.error("Error adding word to bookmarks:", e);
  }
};

// Hook to use the daily revision functionality
export const useDailyRevision = () => {
  const { toast } = useToast();
  
  const startDailyRevision = () => {
    // Check if there's already a session for today
    const existingSession = getTodayRevisionSession();
    
    if (existingSession) {
      return existingSession;
    }
    
    // Generate a new session
    const newSession = generateDailyRevisionSession();
    
    if (!newSession) {
      toast({
        title: "No words available",
        description: "There are no words available for revision. Try adding some chapters or completing learning plans.",
        variant: "destructive",
      });
      return null;
    }
    
    toast({
      title: "Daily Revision Session Created",
      description: `Your session with ${newSession.words.length} words is ready!`,
    });
    
    return newSession;
  };
  
  const startChallengingWordsSession = (sessionId: string) => {
    const session = generateChallengingWordsSession(sessionId);
    
    if (!session) {
      toast({
        title: "No challenging words",
        description: "There are no challenging words to review from this session.",
        variant: "destructive",
      });
      return null;
    }
    
    toast({
      title: "Challenging Words Session Created",
      description: `Your session with ${session.words.length} challenging words is ready!`,
    });
    
    return session;
  };
  
  return {
    startDailyRevision,
    startChallengingWordsSession,
    saveQuizResults,
    getRevisionSession,
  };
};
