import React, { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, SkipForward, Bookmark, RotateCcw, BookText, Search, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Word } from '@/utils/dailyRevisionUtils';
import WordMeaningDialog from '@/components/daily-revision/WordMeaningDialog';
import { getStoredWordMeaning } from '@/utils/geminiApi';
interface QuizAnswer {
  wordId: string;
  word: Word;
  selectedAnswer: string;
  selectedAnswerText?: string; // Add this to store the actual selected text
  correctAnswer: string;
  isCorrect: boolean;
  skipped?: boolean;
}
interface QuizResultsProps {
  score: number;
  totalQuestions: number;
  correctAnswers: QuizAnswer[];
  incorrectAnswers: QuizAnswer[];
  skippedWords: QuizAnswer[];
  bookmarkedWords: Word[];
  onReview: () => void;
  onRetakeAll: () => void;
  onRetakeChallenging: () => void;
  sessionSource: string;
  onReattempt?: () => void;
}
const QuizResults: React.FC<QuizResultsProps> = ({
  score,
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  skippedWords,
  bookmarkedWords,
  onReview,
  onRetakeAll,
  onRetakeChallenging,
  sessionSource,
  onReattempt
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Check for dark mode preference
  useEffect(() => {
    const checkDarkMode = () => {
      const darkMode = document.documentElement.classList.contains('dark') || document.documentElement.getAttribute('data-theme') === 'dark';
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

  // Calculate percentages based on answered questions only
  const answeredQuestions = totalQuestions - skippedWords.length;
  const correctPercent = answeredQuestions > 0 ? Math.round(correctAnswers.length / answeredQuestions * 100) : 0;
  const incorrectPercent = answeredQuestions > 0 ? Math.round(incorrectAnswers.length / answeredQuestions * 100) : 0;
  const skippedPercent = totalQuestions > 0 ? Math.round(skippedWords.length / totalQuestions * 100) : 0;

  // Determine performance label
  const getPerformanceLabel = () => {
    if (correctPercent >= 90) return "Excellent!";
    if (correctPercent >= 75) return "Very Good!";
    if (correctPercent >= 60) return "Good Progress";
    if (correctPercent >= 40) return "Keep Practicing";
    return "Needs More Review";
  };
  const handleReattemptQuiz = () => {
    if (onReattempt) {
      onReattempt();
    } else {
      // Fallback to original functionality
      const urlParams = new URLSearchParams(window.location.search);
      const planId = urlParams.get('planId');
      const setIndex = urlParams.get('setIndex');
      if (planId && setIndex) {
        const newUrl = `/daily-revision?planId=${planId}&setIndex=${setIndex}&mode=quiz`;
        window.location.href = newUrl;
      } else {
        onRetakeAll();
      }
    }
  };

  // Function to speak word pronunciation using Indian English
  const speakWord = (word: string) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);

      // Set to Indian English voice if available
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = voices.find(voice => voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('indian') || voice.name.toLowerCase().includes('india'));
      if (indianVoice) {
        utterance.voice = indianVoice;
      } else {
        // Fallback to any English voice
        const englishVoice = voices.find(voice => voice.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }
      }
      utterance.rate = 0.8; // Slightly slower for better pronunciation
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };
  return <div className="w-full max-w-4xl mx-auto">
      <Card className={`mb-8 ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
        <CardHeader className="text-center">
          <CardTitle className={`text-2xl ${isDarkMode ? 'text-white' : ''}`}>Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center pt-2 pb-6">
          <div className={`text-7xl font-bold mb-2 ${isDarkMode ? 'text-blue-400' : 'text-primary'}`}>{correctPercent}%</div>
          <p className={`text-xl font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{getPerformanceLabel()}</p>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            You answered {correctAnswers.length} out of {answeredQuestions} answered questions correctly
          </p>
          {skippedWords.length > 0 && <p className={`mb-6 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`}>
              You skipped {skippedWords.length} out of {totalQuestions} questions
            </p>}
          
          <div className="grid grid-cols-3 gap-4 w-full max-w-md">
            <div className={`flex flex-col items-center p-3 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-50'}`}>
              <CheckCircle2 className={`h-6 w-6 mb-1 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
              <span className={`text-xl font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>{correctAnswers.length}</span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Correct</span>
            </div>
            <div className={`flex flex-col items-center p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20' : 'bg-red-50'}`}>
              <XCircle className={`h-6 w-6 mb-1 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
              <span className={`text-xl font-medium ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{incorrectAnswers.length}</span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Incorrect</span>
            </div>
            <div className={`flex flex-col items-center p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
              <SkipForward className={`h-6 w-6 mb-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
              <span className={`text-xl font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>{skippedWords.length}</span>
              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Skipped</span>
            </div>
          </div>
          
          {bookmarkedWords.length > 0 && <div className="mt-4 flex items-center">
              <Bookmark className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
              <span className={isDarkMode ? 'text-gray-300' : ''}>You bookmarked {bookmarkedWords.length} words during this quiz</span>
            </div>}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row justify-between gap-3 px-6 pb-6">
          <div className="flex gap-3 w-full sm:w-auto">
            <Button onClick={handleReattemptQuiz} variant="outline" className="flex items-center gap-2">
              <RotateCcw className="h-4 w-4" />
              Reattempt Test
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <div>
        <Tabs defaultValue="all" className={isDarkMode ? 'text-white' : ''}>
          <TabsList className={`mb-4 grid grid-cols-4 max-w-md mx-auto ${isDarkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
            <TabsTrigger value="all" className={isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}>All</TabsTrigger>
            <TabsTrigger value="correct" className={isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}>Correct</TabsTrigger>
            <TabsTrigger value="incorrect" className={isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}>Incorrect</TabsTrigger>
            <TabsTrigger value="skipped" className={isDarkMode ? 'data-[state=active]:bg-gray-700 data-[state=active]:text-white' : ''}>Skipped</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : ''}`}>All Questions</h3>
            <div className="space-y-4">
              {[...correctAnswers, ...incorrectAnswers, ...skippedWords].sort((a, b) => a.word.word.localeCompare(b.word.word)).map((answer, idx) => <AnswerCard key={answer.wordId} answer={answer} index={idx + 1} isDarkMode={isDarkMode} sessionSource={sessionSource} onSpeakWord={speakWord} />)}
            </div>
          </TabsContent>
          
          <TabsContent value="correct">
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : ''}`}>Correct Answers</h3>
            {correctAnswers.length > 0 ? <div className="space-y-4">
                {correctAnswers.map((answer, idx) => <AnswerCard key={answer.wordId} answer={answer} index={idx + 1} isDarkMode={isDarkMode} sessionSource={sessionSource} onSpeakWord={speakWord} />)}
              </div> : <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No correct answers in this quiz</p>}
          </TabsContent>
          
          <TabsContent value="incorrect">
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : ''}`}>Incorrect Answers</h3>
            {incorrectAnswers.length > 0 ? <div className="space-y-4">
                {incorrectAnswers.map((answer, idx) => <AnswerCard key={answer.wordId} answer={answer} index={idx + 1} isDarkMode={isDarkMode} sessionSource={sessionSource} onSpeakWord={speakWord} />)}
              </div> : <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No incorrect answers in this quiz</p>}
          </TabsContent>
          
          <TabsContent value="skipped">
            <h3 className={`text-lg font-medium mb-3 ${isDarkMode ? 'text-white' : ''}`}>Skipped Questions</h3>
            {skippedWords.length > 0 ? <div className="space-y-4">
                {skippedWords.map((answer, idx) => <AnswerCard key={answer.wordId} answer={answer} index={idx + 1} isDarkMode={isDarkMode} sessionSource={sessionSource} onSpeakWord={speakWord} />)}
              </div> : <p className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>No skipped questions in this quiz</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
interface AnswerCardProps {
  answer: QuizAnswer;
  index: number;
  isDarkMode: boolean;
  sessionSource: string;
  onSpeakWord: (word: string) => void;
}
const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  index,
  isDarkMode,
  sessionSource,
  onSpeakWord
}) => {
  const [showMeaningDialog, setShowMeaningDialog] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [hindiMeaning, setHindiMeaning] = useState<string | null>(null);

  // Check if word is already bookmarked and get Hindi meaning
  useEffect(() => {
    try {
      const bookmarksStr = localStorage.getItem('bookmarked_words');
      if (bookmarksStr) {
        const bookmarks = JSON.parse(bookmarksStr);
        const wordBookmarked = bookmarks.some((bm: any) => bm.id === answer.word.id);
        setIsBookmarked(wordBookmarked);
      }
    } catch (error) {
      console.error('Error checking bookmark status:', error);
    }

    // Check for stored Korean meaning
    try {
      const storedMeaning = getStoredWordMeaning(answer.word.word);
      if (storedMeaning && storedMeaning.koreanMeaning) {
        setHindiMeaning(storedMeaning.koreanMeaning);
      }
    } catch (error) {
      console.error('Error getting stored word meaning:', error);
    }
  }, [answer.word.id, answer.word.word]);
  const handleBookmarkToggle = () => {
    try {
      const bookmarksStr = localStorage.getItem('bookmarked_words');
      let bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
      if (isBookmarked) {
        // Remove bookmark
        bookmarks = bookmarks.filter((bm: any) => bm.id !== answer.word.id);
        setIsBookmarked(false);
      } else {
        // Add bookmark with proper chapter name
        let chapterName = 'Quiz Results';

        // Determine the correct chapter name based on session source
        if (sessionSource === 'learning-plan') {
          // Try to get the learning plan title from URL params or localStorage
          const urlParams = new URLSearchParams(window.location.search);
          const planId = urlParams.get('planId');
          if (planId) {
            try {
              const plansStr = localStorage.getItem('learning_plans');
              if (plansStr) {
                const plans = JSON.parse(plansStr);
                const plan = plans.find((p: any) => p.id === planId);
                if (plan) {
                  chapterName = plan.title;
                }
              }
            } catch (e) {
              console.error('Error getting plan title:', e);
            }
          }
        } else if (sessionSource === 'smart-revision') {
          chapterName = 'Smart Revision';
        } else if (sessionSource === 'daily-revision') {
          chapterName = 'Daily Revision';
        }

        // Check if the word has a specific chapter property
        if (answer.word.hasOwnProperty('chapter') && (answer.word as any).chapter) {
          chapterName = (answer.word as any).chapter;
        }
        const newBookmark = {
          id: answer.word.id,
          word: answer.word.word,
          translation: answer.word.definition,
          phonetic: answer.word.phonetic || '',
          chapter: chapterName
        };
        bookmarks.push(newBookmark);
        setIsBookmarked(true);
      }
      localStorage.setItem('bookmarked_words', JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error updating bookmark:', error);
    }
  };

  // Determine background and border colors based on answer status
  const getCardClasses = () => {
    if (isDarkMode) {
      if (answer.isCorrect) return "border-green-700 bg-green-900/20";
      if (answer.skipped) return "border-blue-700 bg-blue-900/20";
      return "border-red-700 bg-red-900/20";
    } else {
      if (answer.isCorrect) return "border-green-200 bg-green-50";
      if (answer.skipped) return "border-blue-200 bg-blue-50";
      return "border-red-200 bg-red-50";
    }
  };
  const getInnerCardClasses = (type: 'answer' | 'correct' | 'skipped') => {
    if (isDarkMode) {
      if (type === 'answer') return "bg-gray-800 border-red-800";
      if (type === 'correct') return "bg-gray-800 border-green-800";
      if (type === 'skipped') return "bg-gray-800 border-blue-800";
    } else {
      if (type === 'answer') return "bg-white border-red-100";
      if (type === 'correct') return "bg-white border-green-100";
      if (type === 'skipped') return "bg-white border-blue-100";
    }
    return "";
  };
  return <Card className={`border ${getCardClasses()}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <span className={`font-medium mr-2 ${isDarkMode ? 'text-white' : ''}`}>{index}.</span>
            <h4 className={`font-medium ${isDarkMode ? 'text-white' : ''}`}>{answer.word.word}</h4>
            
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={e => {
            e.stopPropagation();
            handleBookmarkToggle();
          }} className="h-8 w-8 p-0" title={isBookmarked ? "Remove bookmark" : "Add bookmark"}>
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current text-yellow-500' : isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={e => {
            e.stopPropagation();
            setShowMeaningDialog(true);
          }} className="h-8 w-8 p-0" title="Search word meaning">
              <Search className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </Button>
            <Badge variant={answer.isCorrect ? "success" : answer.skipped ? "default" : "destructive"}>
              {answer.isCorrect ? <span className="flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Correct
                </span> : answer.skipped ? <span className="flex items-center">
                  <SkipForward className="h-3 w-3 mr-1" /> Skipped
                </span> : <span className="flex items-center">
                  <XCircle className="h-3 w-3 mr-1" /> Incorrect
                </span>}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-3 mt-3">
          {!answer.isCorrect && !answer.skipped && answer.selectedAnswerText && <div className={`p-3 rounded border ${getInnerCardClasses('answer')}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className={`font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Your answer: </span>
                {answer.selectedAnswerText}
              </p>
            </div>}
          
          {answer.skipped ? <div className={`p-3 rounded border ${getInnerCardClasses('skipped')}`}>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className={`font-medium ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Question was skipped - No answer selected</span>
              </p>
            </div> : null}
          
          <div className={`p-3 rounded border ${answer.isCorrect ? getInnerCardClasses('correct') : getInnerCardClasses('skipped')}`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <span className={`font-medium ${answer.isCorrect ? isDarkMode ? 'text-green-400' : 'text-green-600' : isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Correct answer: 
              </span>{' '}
              {answer.correctAnswer}
            </p>
            {hindiMeaning && (
              <p className={`text-sm mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <span className={`font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  Hindi: 
                </span>{' '}
                {hindiMeaning}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      
      <WordMeaningDialog word={answer.word.word} open={showMeaningDialog} onOpenChange={setShowMeaningDialog} />
    </Card>;
};
export default QuizResults;