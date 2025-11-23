import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Check, X, Pause, Play, Menu, Star, AlertTriangle, Clock, ChevronUp, ChevronDown, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import QuestionGrid from './QuestionGrid';
import { speakKorean } from '@/utils/textToSpeech';

interface QuizWord {
  id: string;
  word: string;
  definition: string;
  phonetic?: string;
  isBookmarked: boolean;
}

interface QuizModeProps {
  words: QuizWord[];
  onComplete: (results: {
    wordId: string;
    correct: boolean;
    skipped?: boolean;
    selectedAnswerText?: string;
  }[]) => void;
  onBookmarkToggle: (wordId: string) => void;
  onSwitchToFlashcard?: () => void;
}

const QuizMode = ({
  words,
  onComplete,
  onBookmarkToggle,
  onSwitchToFlashcard
}: QuizModeProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [selectedAnswerTexts, setSelectedAnswerTexts] = useState<Record<number, string>>({});
  
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0])); // Start with first question visited
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const [timePerQuestion, setTimePerQuestion] = useState<Record<number, number>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showPauseDialog, setShowPauseDialog] = useState(false);
  const [showBackDialog, setShowBackDialog] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [desktopSidebarVisible, setDesktopSidebarVisible] = useState(true);
  const [showQuestionScroll, setShowQuestionScroll] = useState(false);
  const [bookmarkedWords, setBookmarkedWords] = useState<Set<string>>(new Set());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const questionContentRef = useRef<HTMLDivElement>(null);
  const swipeAreaRef = useRef<HTMLDivElement>(null);

  // Swipe gesture states
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  // Set timeStarted when component mounts
  useEffect(() => {
    setTimeStarted(new Date());
    loadBookmarkedWords();
  }, []);

  // Load bookmarked words from localStorage
  const loadBookmarkedWords = () => {
    try {
      const bookmarksStr = localStorage.getItem('bookmarked_words');
      if (bookmarksStr) {
        const bookmarks = JSON.parse(bookmarksStr);
        const bookmarkedIds = new Set<string>(bookmarks.map((bm: any) => String(bm.id)));
        setBookmarkedWords(bookmarkedIds);
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  // Initialize dark mode from localStorage or system preference
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldUseDark = savedTheme === 'dark' || !savedTheme && systemPrefersDark;
    setIsDarkMode(shouldUseDark);
    updateTheme(shouldUseDark);
  }, []);
  const updateTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add('dark');
      html.setAttribute('data-theme', 'dark');
    } else {
      html.classList.remove('dark');
      html.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  };
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    updateTheme(newDarkMode);
  };

  // Get the specific set/chapter name from the learning plan
  const getSetName = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const planId = urlParams.get('planId');
    if (planId) {
      try {
        const plansStr = localStorage.getItem('learning_plans');
        if (plansStr) {
          const plans = JSON.parse(plansStr);
          const plan = plans.find((p: any) => p.id === planId);

          // Get the first selected chapter's name as the set name
          if (plan?.selectedChapters && plan.selectedChapters.length > 0) {
            return plan.selectedChapters[0].name || 'Chapter';
          }

          // Fallback to plan name if no chapters
          return plan?.name || 'Study Set';
        }
      } catch (error) {
        console.error('Error getting set name:', error);
      }
    }
    return 'Study Set';
  };

  // Generate options for the current question
  const generateOptions = (correctIndex: number): {
    id: string;
    definition: string;
  }[] => {
    const correctWord = words[correctIndex];
    if (!correctWord) return [];
    const options = [{
      id: correctWord.id,
      definition: correctWord.definition
    }];
    const otherWords = words.filter((_, index) => index !== correctIndex);
    if (otherWords.length < 3) {
      while (options.length < 4) {
        options.push({
          id: `fake_${options.length}`,
          definition: `${correctWord.definition} (option ${options.length})`
        });
      }
    } else {
      const shuffled = [...otherWords].sort(() => 0.5 - Math.random());
      for (let i = 0; i < 3 && options.length < 4; i++) {
        options.push({
          id: shuffled[i].id,
          definition: shuffled[i].definition
        });
      }
    }
    return options.sort(() => 0.5 - Math.random());
  };
  const [options, setOptions] = useState<{
    id: string;
    definition: string;
  }[]>([]);
  useEffect(() => {
    setOptions(generateOptions(currentIndex));
  }, [currentIndex, words]);
  const currentWord = words[currentIndex];

  // Update visited questions when currentIndex changes
  useEffect(() => {
    setVisitedQuestions(prev => new Set(prev).add(currentIndex));
  }, [currentIndex]);

  // Touch event handlers for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe && currentIndex < words.length - 1) {
      handleNextQuestion();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevQuestion();
    }
  };
  const handleSelectAnswer = (value: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [currentIndex]: value
    }));
    
    // Store the actual text of the selected answer
    const selectedOption = options.find(option => option.id === value);
    if (selectedOption) {
      setSelectedAnswerTexts(prev => ({
        ...prev,
        [currentIndex]: selectedOption.definition
      }));
    }
  };
  const handleNextQuestion = () => {
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setShowSubmitDialog(true);
    }
  };
  const handlePrevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  const handleBookmark = () => {
    if (currentWord) {
      const setName = getSetName(); // Get the specific set name instead of generic plan name
      const isCurrentlyBookmarked = bookmarkedWords.has(currentWord.id);
      try {
        const bookmarksStr = localStorage.getItem('bookmarked_words');
        let bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];
        if (isCurrentlyBookmarked) {
          // Remove bookmark
          bookmarks = bookmarks.filter((bm: any) => bm.id !== currentWord.id);
          setBookmarkedWords(prev => {
            const newSet = new Set(prev);
            newSet.delete(currentWord.id);
            return newSet;
          });
          toast({
            title: "Bookmark removed",
            description: `"${currentWord.word}" removed from bookmarks.`
          });
        } else {
          // Add bookmark with the specific set name
          const newBookmark = {
            id: currentWord.id,
            word: currentWord.word,
            translation: currentWord.definition,
            phonetic: currentWord.phonetic || '',
            chapter: setName // Use the specific set name here
          };
          bookmarks.push(newBookmark);
          setBookmarkedWords(prev => new Set(prev).add(currentWord.id));
          toast({
            title: "Word bookmarked",
            description: `"${currentWord.word}" added to ${setName}.`
          });
        }
        localStorage.setItem('bookmarked_words', JSON.stringify(bookmarks));
        onBookmarkToggle(currentWord.id);
      } catch (error) {
        console.error('Error updating bookmarks:', error);
        toast({
          title: "Error",
          description: "Failed to update bookmark.",
          variant: "destructive"
        });
      }
    }
  };
  const markQuestion = () => {
    if (selectedAnswers[currentIndex]) {
      handleNextQuestion();
    }
  };
  const clearAnswer = () => {
    setSelectedAnswers(prev => {
      const newAnswers = {
        ...prev
      };
      delete newAnswers[currentIndex];
      return newAnswers;
    });
    setSelectedAnswerTexts(prev => {
      const newTexts = {
        ...prev
      };
      delete newTexts[currentIndex];
      return newTexts;
    });
  };
  const saveAndNext = () => {
    handleNextQuestion();
  };
  const handleSubmitTest = () => {
    setShowSubmitDialog(true);
  };
  const confirmSubmit = () => {
    const quizResults = words.map((word, index) => {
      const selectedOption = selectedAnswers[index];
      const selectedText = selectedAnswerTexts[index];
      const skipped = selectedOption === undefined;
      return {
        wordId: word.id,
        correct: selectedOption === word.id,
        skipped: skipped,
        selectedAnswerText: selectedText
      };
    });
    const answeredQuestions = quizResults.filter(r => !r.skipped);
    const correctAnswers = quizResults.filter(r => r.correct).length;
    const score = answeredQuestions.length > 0 ? Math.round(correctAnswers / answeredQuestions.length * 100) : 0;
    toast({
      title: "Quiz completed",
      description: `Your score: ${score}% (${correctAnswers}/${answeredQuestions.length} correct, ${quizResults.filter(r => r.skipped).length} skipped)`
    });
    onComplete(quizResults);
    setShowSubmitDialog(false);
  };
  const handlePauseResume = () => {
    if (isPaused) {
      setIsPaused(false);
    } else {
      setShowPauseDialog(true);
    }
  };
  const confirmPause = () => {
    setIsPaused(true);
    setShowPauseDialog(false);
  };
  const cancelPause = () => {
    setShowPauseDialog(false);
  };
  const handleBackDuringTest = () => {
    if (isPaused) {
      navigate('/learning-plans');
      return;
    }
    setShowBackDialog(true);
  };
  const confirmBack = () => {
    navigate('/learning-plans');
    setShowBackDialog(false);
  };
  const cancelBack = () => {
    setShowBackDialog(false);
  };

  // Convert words to Question format for the grid
  const questions = words.map((word, index) => ({
    id: index + 1,
    question: word.word,
    options: [],
    answered: selectedAnswers[index] !== undefined,
    visited: visitedQuestions.has(index),
    selectedAnswer: selectedAnswers[index] ? 1 : null
  }));
  const QuestionGridComponent = () => <QuestionGrid questions={questions} currentQuestion={currentIndex} onQuestionSelect={index => {
    setCurrentIndex(index);
    setVisitedQuestions(prev => new Set(prev).add(index));
  }} onSubmitTest={handleSubmitTest} isTestPaused={isPaused} isDarkMode={isDarkMode} onDarkModeToggle={toggleDarkMode} />;
  if (!currentWord || options.length === 0) return null;
  return <div className={`min-h-screen flex relative transition-colors ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Pause Overlay */}
      {isPaused && <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center">
          <div className={`rounded-lg p-8 text-center shadow-xl max-w-md mx-4 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white'}`}>
            <div className="mb-6">
              <Pause className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Quiz Paused</h2>
              <p className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>
                Your quiz is currently paused. You can resume where you left off.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button onClick={() => setIsPaused(false)} className="w-full bg-green-600 hover:bg-green-700">
                <Play className="w-4 h-4 mr-2" />
                Resume Quiz
              </Button>
              <Button onClick={handleBackDuringTest} variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Leave Quiz
              </Button>
            </div>
          </div>
        </div>}

      {/* Main Content - Full Screen */}
      <div className={`flex-1 flex flex-col h-screen ${isPaused ? 'blur-sm' : ''}`}>
        {/* Minimal Header with Back Button and Bookmark */}
        <div className={`flex items-center justify-between p-3 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleBackDuringTest}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>Quiz Mode</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bookmark Button moved here */}
            

            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" onClick={e => {
                if (window.innerWidth >= 1024) {
                  e.preventDefault();
                  setDesktopSidebarVisible(!desktopSidebarVisible);
                }
              }}>
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-0">
                <QuestionGridComponent />
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Question Content */}
        <div className="flex-1 flex">
          <div ref={swipeAreaRef} className="flex-1 relative" onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
            <div ref={questionContentRef} className="h-full p-4 overflow-y-auto" style={{
            maxHeight: 'calc(100vh - 140px)'
          }}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`text-lg leading-relaxed font-bold flex items-center gap-2 ${isDarkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                    <span className="font-bold">{currentIndex + 1}.</span> What is the definition of "<span className="font-bold">{currentWord.word}</span>"?
                    <Button variant="ghost" size="sm" onClick={() => speakKorean(currentWord.word)} className="h-8 w-8 p-0" title="Pronounce">
                      <Volume2 className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Answer Options */}
              <div className="space-y-3">
                {options.map((option, index) => <Card key={index} className={`p-4 cursor-pointer transition-all border-2 ${selectedAnswers[currentIndex] === option.id ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400" : isDarkMode ? "border-gray-600 hover:border-gray-500 hover:bg-gray-800 bg-gray-800/50" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`} onClick={() => handleSelectAnswer(option.id)}>
                    <div className="flex items-center gap-3">
                      <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{index + 1}.</span>
                      <span className={`text-base font-medium ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{option.definition}</span>
                    </div>
                  </Card>)}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed Position */}
        <div className={`flex gap-3 p-4 border-t sticky bottom-0 z-10 ${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
          <Button variant="outline" className="flex-1" onClick={markQuestion}>
            Mark & Next
          </Button>
          <Button variant="outline" className="flex-1" onClick={clearAnswer}>
            Clear
          </Button>
          <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={saveAndNext}>
            Save & Next
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block border-l transition-all duration-300 ${desktopSidebarVisible ? "w-72" : "w-0 overflow-hidden"} ${isPaused ? 'blur-sm' : ''} ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
        <QuestionGridComponent />
      </div>

      {/* Dialogs */}
      <Dialog open={showPauseDialog} onOpenChange={setShowPauseDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">Are you sure you want to pause the quiz?</DialogTitle>
          </DialogHeader>
          <DialogFooter className="flex gap-3 justify-center sm:justify-center">
            <Button variant="outline" onClick={cancelPause} className="flex-1">
              No
            </Button>
            <Button onClick={confirmPause} className="flex-1 bg-blue-600 hover:bg-blue-700">
              Yes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent className="fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-center">
              Submit Quiz?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 text-center">
              Are you sure you want to submit the quiz? You won't be able to change your answers after submission.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <AlertDialogCancel onClick={() => setShowSubmitDialog(false)} className="flex-1 sm:flex-initial">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit} className="flex-1 sm:flex-initial bg-red-600 hover:bg-red-700">
              Submit Quiz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isPaused && <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
          <AlertDialogContent className="fixed left-[50%] top-[50%] z-[100] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-lg font-semibold text-center">
                Leave Quiz?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600 text-center">
                Are you sure you want to leave the quiz? Your progress will be saved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
              <AlertDialogCancel onClick={cancelBack} className="flex-1 sm:flex-initial">
                Stay in Quiz
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmBack} className="flex-1 sm:flex-initial bg-orange-600 hover:bg-orange-700">
                Leave Quiz
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>}
    </div>;
};

export default QuizMode;
