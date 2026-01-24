import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, BookOpen, Calendar, Clock, ArrowLeft, RefreshCw, Flame, ListChecks } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import FlashcardMode from '@/components/revision/FlashcardMode';
import QuizMode from '@/components/revision/QuizMode';
import QuizResults from '@/components/revision/QuizResults';
import { RevisionSession, Word, useDailyRevision, getRevisionSession } from '@/utils/dailyRevisionUtils';
import { useSmartRevision } from '@/components/revision/SmartRevisionGenerator';

type RevisionMode = 'flashcard' | 'quiz' | 'results' | 'intro';

interface QuizAnswer {
  wordId: string;
  word: Word;
  selectedAnswer: string;
  selectedAnswerText?: string;
  correctAnswer: string;
  isCorrect: boolean;
  skipped?: boolean;
}

interface SavedQuizResult {
  sessionId: string;
  planId?: string;
  setIndex?: number;
  score: number;
  answers: QuizAnswer[];
  bookmarkedWordIds: string[];
  completedAt: string;
  source: string;
}

const DailyRevision = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    startDailyRevision,
    startChallengingWordsSession,
    saveQuizResults
  } = useDailyRevision();
  const {
    getSmartRevisionSets,
    markSetAsCompleted
  } = useSmartRevision();

  const [mode, setMode] = useState<RevisionMode>('intro');
  const [currentSession, setCurrentSession] = useState<RevisionSession | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [flashcardCompleted, setFlashcardCompleted] = useState(false);
  const [knownWordIds, setKnownWordIds] = useState<string[]>([]);
  const [unknownWordIds, setUnknownWordIds] = useState<string[]>([]);
  const [bookmarkedWordIds, setBookmarkedWordIds] = useState<string[]>([]);
  const [quizScore, setQuizScore] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswer[]>([]);
  const [learningPlan, setLearningPlan] = useState<any>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isQuizMode = mode === 'quiz';

  // Check for dark mode preference
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark') || 
                      document.documentElement.getAttribute('data-theme') === 'dark';
      setIsDarkMode(darkMode);
    };

    checkDarkMode();
    
    // Listen for theme changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'data-theme']
    });

    return () => observer.disconnect();
  }, []);

  // Save quiz results to localStorage
  const saveQuizResultsToLocal = (planId: string, setIndex: number, score: number, answers: QuizAnswer[], bookmarked: string[], source: string) => {
    try {
      const savedResults = localStorage.getItem('saved_quiz_results');
      const results: SavedQuizResult[] = savedResults ? JSON.parse(savedResults) : [];
      
      // Remove any existing results for this plan and set
      const filteredResults = results.filter(result => 
        !(result.planId === planId && result.setIndex === setIndex)
      );
      
      // Add new result
      const newResult: SavedQuizResult = {
        sessionId: `${planId}-${setIndex}-${Date.now()}`,
        planId,
        setIndex,
        score,
        answers,
        bookmarkedWordIds: bookmarked,
        completedAt: new Date().toISOString(),
        source
      };
      
      filteredResults.push(newResult);
      localStorage.setItem('saved_quiz_results', JSON.stringify(filteredResults));
      
      console.log('Saved quiz result:', newResult);
    } catch (error) {
      console.error('Error saving quiz results:', error);
    }
  };

  // Load saved quiz results
  const loadSavedQuizResults = (planId: string, setIndex: number): SavedQuizResult | null => {
    try {
      const savedResults = localStorage.getItem('saved_quiz_results');
      if (!savedResults) return null;
      
      const results: SavedQuizResult[] = JSON.parse(savedResults);
      const result = results.find(r => r.planId === planId && r.setIndex === setIndex);
      
      console.log('Loading saved results for:', { planId, setIndex }, 'Found:', result);
      return result || null;
    } catch (error) {
      console.error('Error loading saved quiz results:', error);
      return null;
    }
  };

  useEffect(() => {
    const planId = searchParams.get('planId');
    const setIndex = searchParams.get('setIndex');
    const sessionId = searchParams.get('sessionId');
    const source = searchParams.get('source');
    const initialMode = searchParams.get('mode');
    const showSavedResults = searchParams.get('showSavedResults');

    console.log('URL params:', { planId, setIndex, sessionId, source, initialMode, showSavedResults });

    // Handle showing saved results
    if (showSavedResults === 'true' && planId && setIndex !== null) {
      console.log('Attempting to show saved results...');
      
      const savedResult = loadSavedQuizResults(planId, Number(setIndex));
      if (savedResult) {
        console.log('Found saved quiz result:', savedResult);
        
        // Load the learning plan to get the current session
        try {
          const plansStr = localStorage.getItem('learning_plans');
          if (plansStr) {
            const plans = JSON.parse(plansStr);
            const plan = plans.find((p: any) => p.id === planId);
            if (plan && plan.sets && plan.sets[Number(setIndex)]) {
              setLearningPlan(plan);
              const set = plan.sets[Number(setIndex)];
              
              const session: RevisionSession = {
                id: savedResult.sessionId,
                date: savedResult.completedAt,
                words: set.words,
                source: 'learning-plan',
                completed: true,
                learningPlanInfo: {
                  planId,
                  setIndex: Number(setIndex)
                }
              };
              
              setCurrentSession(session);
              setQuizAnswers(savedResult.answers);
              setQuizScore(savedResult.score);
              setBookmarkedWordIds(savedResult.bookmarkedWordIds);
              setMode('results');
              return;
            }
          }
        } catch (error) {
          console.error("Error loading learning plan for saved results:", error);
        }
      } else {
        console.log('No saved results found');
      }
    }

    if (sessionId) {
      const session = getRevisionSession(sessionId);
      if (session) {
        setCurrentSession(session);
        setMode(initialMode === 'quiz' ? 'quiz' : 'flashcard');
      }
    } else if (planId && setIndex) {
      try {
        const plansStr = localStorage.getItem('learning_plans');
        if (plansStr) {
          const plans = JSON.parse(plansStr);
          const plan = plans.find((p: any) => p.id === planId);
          if (plan && plan.sets && plan.sets[Number(setIndex)]) {
            setLearningPlan(plan);
            const set = plan.sets[Number(setIndex)];
            const session: RevisionSession = {
              id: `learning-plan-${Date.now()}`,
              date: new Date().toISOString(),
              words: set.words,
              source: 'learning-plan',
              completed: false,
              learningPlanInfo: {
                planId,
                setIndex: Number(setIndex)
              }
            };
            setCurrentSession(session);
            
            if (plan.quizMode === 'only-quiz') {
              setMode('quiz');
              setFlashcardCompleted(true);
            } else if (initialMode === 'quiz' && set.flashcardCompleted) {
              setMode('quiz');
            } else {
              setMode('flashcard');
            }
          }
        }
      } catch (e) {
        console.error("Error loading learning plan:", e);
      }
    } else if (source === 'smart-revision') {
      const smartSets = getSmartRevisionSets();
      const todaySet = smartSets.find(set => !set.completed);
      if (todaySet) {
        setCurrentSession(todaySet);
        setMode('flashcard');
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (currentSession) {
      const bookmarked: string[] = [];
      currentSession.words.forEach(word => {
        if (word.isBookmarked) {
          bookmarked.push(word.id);
        }
      });
      setBookmarkedWordIds(bookmarked);
    }
  }, [currentSession]);

  const handleFlashcardComplete = (results: {
    correct: number;
    incorrect: number;
    skipped: number;
    total: number;
  }) => {
    const known: string[] = [];
    const unknown: string[] = [];
    setKnownWordIds(known);
    setUnknownWordIds(unknown);
    setFlashcardCompleted(true);
    if (currentSession?.source === 'learning-plan' && currentSession.learningPlanInfo && learningPlan) {
      try {
        const {
          planId,
          setIndex
        } = currentSession.learningPlanInfo;
        const plansStr = localStorage.getItem('learning_plans');
        if (plansStr) {
          const plans = JSON.parse(plansStr);
          const planIndex = plans.findIndex((p: any) => p.id === planId);
          if (planIndex >= 0 && plans[planIndex].sets[setIndex]) {
            plans[planIndex].sets[setIndex].flashcardCompleted = true;
            plans[planIndex].sets[setIndex].knownWordIds = known;
            plans[planIndex].sets[setIndex].unknownWordIds = unknown;
            
            if (learningPlan.quizMode === 'only-quiz') {
              plans[planIndex].sets[setIndex].isCompleted = true;
              plans[planIndex].sets[setIndex].dateCompleted = new Date().toISOString();
              if (!plans[planIndex].completedSets.includes(plans[planIndex].sets[setIndex].id)) {
                plans[planIndex].completedSets.push(plans[planIndex].sets[setIndex].id);
              }
              if (setIndex < plans[planIndex].sets.length - 1) {
                plans[planIndex].sets[setIndex + 1].isUnlocked = true;
                plans[planIndex].sets[setIndex + 1].dateUnlocked = new Date().toISOString();
                plans[planIndex].currentSetIndex = setIndex + 1;
              }
            } else if (plans[planIndex].sets[setIndex].quizCompleted) {
              plans[planIndex].sets[setIndex].isCompleted = true;
              plans[planIndex].sets[setIndex].dateCompleted = new Date().toISOString();
              if (!plans[planIndex].completedSets.includes(plans[planIndex].sets[setIndex].id)) {
                plans[planIndex].completedSets.push(plans[planIndex].sets[setIndex].id);
              }
              if (setIndex < plans[planIndex].sets.length - 1) {
                plans[planIndex].sets[setIndex + 1].isUnlocked = true;
                plans[planIndex].sets[setIndex + 1].dateUnlocked = new Date().toISOString();
                plans[planIndex].currentSetIndex = setIndex + 1;
              }
            }
            localStorage.setItem('learning_plans', JSON.stringify(plans));
          }
        }
      } catch (e) {
        console.error("Error updating learning plan after flashcard completion:", e);
      }
    }
  };

  const handleStartDailyRevision = () => {
    const session = startDailyRevision();
    if (session) {
      setCurrentSession(session);
      setMode('flashcard');
    }
  };

  const handleStartSmartRevision = () => {
    const smartSets = getSmartRevisionSets();
    const todaySet = smartSets.find(set => !set.completed);
    if (todaySet) {
      setCurrentSession(todaySet);
      setMode('flashcard');
    } else {
      handleStartDailyRevision();
    }
  };

  const handleBookmarkToggle = (wordId: string) => {
    if (currentSession) {
      setBookmarkedWordIds(prev => {
        if (prev.includes(wordId)) {
          return prev.filter(id => id !== wordId);
        } else {
          return [...prev, wordId];
        }
      });
      const updatedWords = currentSession.words.map(word => {
        if (word.id === wordId) {
          return {
            ...word,
            isBookmarked: !word.isBookmarked
          };
        }
        return word;
      });
      setCurrentSession({
        ...currentSession,
        words: updatedWords
      });
      const word = currentSession.words.find(w => w.id === wordId);
      if (word) {
        const isNowBookmarked = !word.isBookmarked;
        try {
          const bookmarksStr = localStorage.getItem('bookmarked_words');
          const bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
          if (isNowBookmarked) {
            if (!bookmarks.some((bm: any) => bm.id === wordId)) {
              let chapterName = "Daily Revision";
              
              if (currentSession.source === 'learning-plan' && learningPlan) {
                // Use the learning plan title as the chapter name
                chapterName = learningPlan.title;
              } else if (currentSession.source === 'smart-revision') {
                chapterName = "Smart Revision";
              } else if (currentSession.source === 'challenging-words') {
                chapterName = "Challenging Words";
              }
              
              // Check if the word has a specific chapter property
              if (word.hasOwnProperty('chapter') && (word as any).chapter) {
                chapterName = (word as any).chapter;
              }
              
              bookmarks.push({
                id: word.id,
                word: word.word,
                translation: word.definition,
                phonetic: word.phonetic,
                chapter: chapterName
              });
            }
          } else {
            const filteredBookmarks = bookmarks.filter((bm: any) => bm.id !== wordId);
            localStorage.setItem('bookmarked_words', JSON.stringify(filteredBookmarks));
            return;
          }
          localStorage.setItem('bookmarked_words', JSON.stringify(bookmarks));
        } catch (error) {
          console.error("Error updating bookmarks:", error);
        }
      }
    }
  };

  const handleSwitchToQuizAll = () => {
    setMode('quiz');
  };

  const handleSwitchToQuizUnknown = () => {
    if (currentSession && unknownWordIds.length > 0) {
      const unknownWords = currentSession.words.filter(word => unknownWordIds.includes(word.id));
      const unknownSession: RevisionSession = {
        ...currentSession,
        id: `unknown-words-${Date.now()}`,
        words: unknownWords
      };
      setCurrentSession(unknownSession);
      setMode('quiz');
    } else {
      setMode('quiz');
    }
  };

  const handleQuizComplete = (results: {
    wordId: string;
    correct: boolean;
    skipped?: boolean;
    selectedAnswerText?: string;
  }[]) => {
    const correctIds: string[] = [];
    const incorrectIds: string[] = [];
    const skippedIds: string[] = [];
    const answers: QuizAnswer[] = [];

    if (currentSession && results.length > 0) {
      results.forEach(result => {
        const word = currentSession.words.find(w => w.id === result.wordId);
        if (word) {
          if (result.skipped) {
            skippedIds.push(result.wordId);
            const correctAnswer = word.definition;
            answers.push({
              wordId: result.wordId,
              word,
              selectedAnswer: "",
              correctAnswer,
              isCorrect: false,
              skipped: true
            });
          } else if (result.correct) {
            correctIds.push(result.wordId);
            const correctAnswer = word.definition;
            answers.push({
              wordId: result.wordId,
              word,
              selectedAnswer: correctAnswer,
              selectedAnswerText: result.selectedAnswerText || correctAnswer,
              correctAnswer,
              isCorrect: true
            });
          } else {
            incorrectIds.push(result.wordId);
            const correctAnswer = word.definition;
            answers.push({
              wordId: result.wordId,
              word,
              selectedAnswer: "Incorrect answer",
              selectedAnswerText: result.selectedAnswerText || "Incorrect answer",
              correctAnswer,
              isCorrect: false
            });
          }
        }
      });

      const answeredCount = correctIds.length + incorrectIds.length;
      const score = answeredCount > 0 ? Math.round(correctIds.length / answeredCount * 100) : 0;

      setQuizScore(score);
      setQuizAnswers(answers);

      if (currentSession.source === 'smart-revision') {
        markSetAsCompleted(currentSession.id);
      }

      saveQuizResults(currentSession.id, score, {
        correct: correctIds,
        incorrect: incorrectIds,
        skipped: skippedIds,
        bookmarked: bookmarkedWordIds
      });

      // Save to localStorage for learning plan sessions
      if (currentSession.source === 'learning-plan' && currentSession.learningPlanInfo && learningPlan) {
        const { planId, setIndex } = currentSession.learningPlanInfo;
        saveQuizResultsToLocal(planId, setIndex, score, answers, bookmarkedWordIds, 'learning-plan');

        try {
          const plansStr = localStorage.getItem('learning_plans');
          if (plansStr) {
            const plans = JSON.parse(plansStr);
            const planIndex = plans.findIndex((p: any) => p.id === planId);
            if (planIndex >= 0 && plans[planIndex].sets[setIndex]) {
              plans[planIndex].sets[setIndex].quizCompleted = true;
              plans[planIndex].sets[setIndex].knownWordIds = correctIds;
              plans[planIndex].sets[setIndex].unknownWordIds = incorrectIds;
              
              if (learningPlan.quizMode === 'only-quiz' || 
                  (plans[planIndex].sets[setIndex].flashcardCompleted && plans[planIndex].sets[setIndex].quizCompleted)) {
                plans[planIndex].sets[setIndex].isCompleted = true;
                plans[planIndex].sets[setIndex].dateCompleted = new Date().toISOString();
                if (!plans[planIndex].completedSets.includes(plans[planIndex].sets[setIndex].id)) {
                  plans[planIndex].completedSets.push(plans[planIndex].sets[setIndex].id);
                }
                if (setIndex < plans[planIndex].sets.length - 1) {
                  plans[planIndex].sets[setIndex + 1].isUnlocked = true;
                  plans[planIndex].sets[setIndex + 1].dateUnlocked = new Date().toISOString();
                }
                plans[planIndex].currentSetIndex = Math.min(setIndex + 1, plans[planIndex].sets.length - 1);
              }
              localStorage.setItem('learning_plans', JSON.stringify(plans));
            }
          }
        } catch (e) {
          console.error("Error updating learning plan:", e);
        }
      }
    }

    setMode('results');
  };

  const handleReviewAnswers = () => {};

  const handleRetakeAll = () => {
    if (currentSession) {
      setIsFlipped(false);
      setFlashcardCompleted(false);
      setKnownWordIds([]);
      setUnknownWordIds([]);
      setMode('flashcard');
    }
  };

  const handleRetakeChallenging = () => {
    if (currentSession) {
      const challengingSession = startChallengingWordsSession(currentSession.id);
      if (challengingSession) {
        setIsFlipped(false);
        setFlashcardCompleted(false);
        setKnownWordIds([]);
        setUnknownWordIds([]);
        setCurrentSession(challengingSession);
        setMode('flashcard');
      }
    }
  };

  const correctAnswers = quizAnswers.filter(answer => answer.isCorrect);
  const incorrectAnswers = quizAnswers.filter(answer => !answer.isCorrect && answer.selectedAnswer);
  const skippedWords = quizAnswers.filter(answer => !answer.selectedAnswer);
  const bookmarkedWords = currentSession ? currentSession.words.filter(word => bookmarkedWordIds.includes(word.id)) : [];

  if (isQuizMode && currentSession) {
    return (
      <div className="h-screen w-screen overflow-hidden">
        <QuizMode 
          words={currentSession.words} 
          onComplete={handleQuizComplete} 
          onBookmarkToggle={handleBookmarkToggle} 
        />
      </div>
    );
  }

  const handleReattemptTest = () => {
    // Get current URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    const setIndex = urlParams.get('setIndex');
    
    if (planId && setIndex) {
      // Reset state immediately to prevent blank screen
      setMode('quiz');
      setQuizScore(0);
      setQuizAnswers([]);
      
      // Load the learning plan and session data
      try {
        const plansStr = localStorage.getItem('learning_plans');
        if (plansStr) {
          const plans = JSON.parse(plansStr);
          const plan = plans.find((p: any) => p.id === planId);
          if (plan && plan.sets && plan.sets[Number(setIndex)]) {
            setLearningPlan(plan);
            const set = plan.sets[Number(setIndex)];
            
            const session: RevisionSession = {
              id: `reattempt-${Date.now()}`,
              date: new Date().toISOString(),
              words: set.words,
              source: 'learning-plan',
              completed: false,
              learningPlanInfo: {
                planId,
                setIndex: Number(setIndex)
              }
            };
            
            setCurrentSession(session);
          }
        }
      } catch (e) {
        console.error("Error loading learning plan for reattempt:", e);
      }
    }
  };

  return (
    <div className={`min-h-screen transition-colors safe-area-inset ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 lg:px-8">
        {mode === 'intro' ? (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6 sm:mb-8 text-center">
              <div className={`inline-flex items-center justify-center p-2 rounded-full mb-3 sm:mb-4 ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
                <Activity className={`h-6 w-6 sm:h-8 sm:w-8 ${isDarkMode ? 'text-blue-400' : 'text-primary'}`} />
              </div>
              <h1 className={`text-2xl sm:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Daily Revision</h1>
              <p className={`mt-2 text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Boost your learning with daily practice sessions tailored to your progress
              </p>
            </div>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : ''} active:scale-[0.99] transition-transform`}>
                <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2.5 sm:p-3 rounded-full mb-3 sm:mb-4 ${isDarkMode ? 'bg-blue-900/20' : 'bg-primary/10'}`}>
                      <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-blue-400' : 'text-primary'}`} />
                    </div>
                    <h3 className={`font-medium text-base sm:text-lg mb-1.5 sm:mb-2 ${isDarkMode ? 'text-white' : ''}`}>Daily Session</h3>
                    <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Focus on words you've struggled with based on your learning history
                    </p>
                    <Button onClick={handleStartDailyRevision} className="w-full touch-target h-10 sm:h-11">
                      Start Daily Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : ''} active:scale-[0.99] transition-transform`}>
                <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2.5 sm:p-3 rounded-full mb-3 sm:mb-4 ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-100'}`}>
                      <Flame className={`h-5 w-5 sm:h-6 sm:w-6 ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`} />
                    </div>
                    <h3 className={`font-medium text-base sm:text-lg mb-1.5 sm:mb-2 ${isDarkMode ? 'text-white' : ''}`}>Smart Revision</h3>
                    <p className={`text-xs sm:text-sm mb-4 sm:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      AI-powered revision focusing on your most challenging words
                    </p>
                    <Button onClick={handleStartSmartRevision} variant="secondary" className="w-full touch-target h-10 sm:h-11">
                      Start Smart Revision
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <p className={`text-xs sm:text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Daily revision uses intelligent algorithms to help you focus on words 
                you've struggled with in the past, optimizing your learning time.
              </p>
              
              <Button variant="outline" onClick={() => navigate('/chapters')} className="touch-target h-10 sm:h-11">
                <BookOpen className="h-4 w-4 mr-2" /> Browse Chapters
              </Button>
            </div>
          </div>
        ) : (
          <div>
            {mode === 'flashcard' && currentSession && (
              <div>
                {flashcardCompleted ? (
                  <div className="max-w-md mx-auto my-10">
                    <Card className={isDarkMode ? 'bg-gray-800 border-gray-700' : ''}>
                      <CardContent className="p-6 text-center">
                        <div className="mb-6">
                          <div className={`inline-flex items-center justify-center p-3 rounded-full mb-4 ${isDarkMode ? 'bg-green-900/20' : 'bg-green-100'}`}>
                            <ListChecks className={`h-6 w-6 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                          </div>
                          <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : ''}`}>Flashcards Completed</h2>
                          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            You've reviewed {currentSession.words.length} words.
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{knownWordIds.length}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Words you know</p>
                          </div>
                          <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-amber-900/20' : 'bg-amber-50'}`}>
                            <p className={`text-xl font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-600'}`}>{unknownWordIds.length}</p>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Words to learn</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <Button onClick={handleSwitchToQuizAll} className="w-full">
                            Take Quiz with All Words
                          </Button>
                          
                          <Button onClick={handleSwitchToQuizUnknown} variant="outline" className="w-full" disabled={unknownWordIds.length === 0}>
                            Focus on Unknown Words ({unknownWordIds.length})
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <FlashcardMode words={currentSession.words} onComplete={handleFlashcardComplete} onBookmark={handleBookmarkToggle} />
                )}
              </div>
            )}
            
            {mode === 'results' && currentSession && (
              <div>
                <QuizResults 
                  score={quizScore} 
                  totalQuestions={quizAnswers.length} 
                  correctAnswers={correctAnswers} 
                  incorrectAnswers={incorrectAnswers} 
                  skippedWords={skippedWords} 
                  bookmarkedWords={bookmarkedWords} 
                  onReview={handleReviewAnswers} 
                  onRetakeAll={handleRetakeAll} 
                  onRetakeChallenging={handleRetakeChallenging} 
                  sessionSource={currentSession.source}
                  onReattempt={handleReattemptTest}
                />
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default DailyRevision;
