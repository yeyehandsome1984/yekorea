import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuizModeComponent from '@/components/revision/QuizMode';
import QuizResults from '@/components/revision/QuizResults';

interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
}

interface QuizAnswer {
  wordId: string;
  word: Word;
  selectedAnswer: string;
  selectedAnswerText?: string;
  correctAnswer: string;
  isCorrect: boolean;
  skipped?: boolean;
}

const QuizMode = () => {
  const navigate = useNavigate();
  const { chapterId } = useParams();
  const { toast } = useToast();

  const [words, setWords] = useState<Word[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quizSource, setQuizSource] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null);

  useEffect(() => {
    // Check if this is a bookmarks quiz
    const source = sessionStorage.getItem('quiz_source');
    const storedWords = sessionStorage.getItem('quiz_words');
    
    setQuizSource(source || '');

    if (source === 'bookmarks' && storedWords) {
      try {
        const quizWords = JSON.parse(storedWords);
        console.log('Loading quiz words from bookmarks:', quizWords);
        // Remove any numbering that might have been added
        const cleanedWords = quizWords.map((word: any) => ({
          ...word,
          word: word.word.replace(/^\d+\.\s*/, '') // Remove "1. " type numbering from the beginning
        }));
        setWords(cleanedWords);
      } catch (error) {
        console.error('Error parsing quiz words:', error);
        toast({
          title: "Error loading quiz",
          description: "Could not load bookmarked words for quiz.",
          variant: "destructive",
        });
        navigate('/bookmarks');
      }
    } else if (chapterId) {
      // Original chapter-based quiz logic
      const localStorageKey = `chapter_${chapterId}`;
      const savedChapter = localStorage.getItem(localStorageKey);
      
      if (savedChapter) {
        try {
          const chapterData = JSON.parse(savedChapter);
          if (chapterData.words && chapterData.words.length > 0) {
            const shuffledWords = [...chapterData.words].sort(() => 0.5 - Math.random()).slice(0, 10);
            setWords(shuffledWords);
          } else {
            toast({
              title: "No words found",
              description: "This chapter doesn't have any words to quiz on.",
              variant: "destructive",
            });
            navigate(`/chapters/${chapterId}`);
          }
        } catch (e) {
          console.error("Error parsing chapter data from localStorage:", e);
          toast({
            title: "Error loading chapter",
            description: "Could not load words for this quiz.",
            variant: "destructive",
          });
          navigate(`/chapters/${chapterId}`);
        }
      } else {
        toast({
          title: "Chapter not found",
          description: "Could not find the chapter for this quiz.",
          variant: "destructive",
        });
        navigate('/chapters');
      }
    } else {
      toast({
        title: "Invalid quiz",
        description: "No valid quiz source found.",
        variant: "destructive",
      });
      navigate('/bookmarks');
    }
    
    setIsLoading(false);
  }, [chapterId, navigate, toast]);

  const handleQuizComplete = (results: { wordId: string; correct: boolean; skipped?: boolean; selectedAnswerText?: string; }[]) => {
    const correctCount = results.filter(r => r.correct).length;
    const answeredCount = results.filter(r => !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;
    const score = answeredCount > 0 ? Math.round((correctCount / answeredCount) * 100) : 0;

    // Create detailed quiz results for the results page
    const correctAnswers: QuizAnswer[] = [];
    const incorrectAnswers: QuizAnswer[] = [];
    const skippedWords: QuizAnswer[] = [];

    results.forEach(result => {
      const word = words.find(w => w.id === result.wordId);
      if (!word) return;

      const quizAnswer: QuizAnswer = {
        wordId: result.wordId,
        word: word,
        selectedAnswer: result.skipped ? '' : word.id, // Store the ID for comparison
        selectedAnswerText: result.selectedAnswerText, // Store the actual text that was selected
        correctAnswer: word.definition,
        isCorrect: result.correct,
        skipped: result.skipped
      };

      if (result.skipped) {
        skippedWords.push(quizAnswer);
      } else if (result.correct) {
        correctAnswers.push(quizAnswer);
      } else {
        incorrectAnswers.push(quizAnswer);
      }
    });

    // Set results to show results page
    setQuizResults({
      score,
      totalQuestions: results.length,
      correctAnswers,
      incorrectAnswers,
      skippedWords,
      bookmarkedWords: words.filter(w => w.isBookmarked),
      sessionSource: quizSource
    });
    
    setShowResults(true);

    toast({
      title: "Quiz Complete!",
      description: `Score: ${score}% (${correctCount}/${answeredCount} correct, ${skippedCount} skipped)`,
    });
  };

  const handleReturnToSource = () => {
    // Clean up session storage
    sessionStorage.removeItem('quiz_words');
    sessionStorage.removeItem('quiz_source');
    sessionStorage.removeItem('quiz_range');
    sessionStorage.removeItem('quiz_section');
    
    if (quizSource === 'bookmarks') {
      navigate('/bookmarks');
    } else {
      navigate(`/chapters/${chapterId}`);
    }
  };

  const handleReattemptQuiz = () => {
    setShowResults(false);
    setQuizResults(null);
  };

  const handleBookmarkToggle = (wordId: string) => {
    // Update local state
    setWords(prev => prev.map(word => 
      word.id === wordId ? { ...word, isBookmarked: !word.isBookmarked } : word
    ));

    const word = words.find(w => w.id === wordId);
    if (!word) return;

    const isNowBookmarked = !word.isBookmarked;

    try {
      const bookmarksStr = localStorage.getItem('bookmarked_words');
      let bookmarks = bookmarksStr ? JSON.parse(bookmarksStr) : [];

      if (isNowBookmarked) {
        // Determine the correct chapter name
        let chapterName = quizSource === 'bookmarks' ? 'Bookmarks Practice' : 'Quiz Practice';
        
        // If we have chapter information, use it
        if (chapterId) {
          const localStorageKey = `chapter_${chapterId}`;
          const savedChapter = localStorage.getItem(localStorageKey);
          if (savedChapter) {
            try {
              const chapterData = JSON.parse(savedChapter);
              chapterName = chapterData.title || chapterData.name || chapterId;
            } catch (e) {
              console.error("Error parsing chapter data:", e);
              chapterName = chapterId;
            }
          }
        }

        // Add bookmark with correct chapter name
        if (!bookmarks.some((bm: any) => bm.id === wordId)) {
          bookmarks.push({
            id: word.id,
            word: word.word,
            translation: word.definition,
            phonetic: word.phonetic || '',
            chapter: chapterName
          });
        }
      } else {
        // Remove bookmark
        bookmarks = bookmarks.filter((bm: any) => bm.id !== wordId);
      }

      localStorage.setItem('bookmarked_words', JSON.stringify(bookmarks));
    } catch (error) {
      console.error("Error updating bookmarks:", error);
    }

    // For chapter-based quizzes, also update localStorage
    if (chapterId) {
      const localStorageKey = `chapter_${chapterId}`;
      const savedChapter = localStorage.getItem(localStorageKey);
      
      if (savedChapter) {
        try {
          const chapterData = JSON.parse(savedChapter);
          
          if (chapterData.words) {
            const wordIndex = chapterData.words.findIndex((w: Word) => w.id === wordId);
            
            if (wordIndex >= 0) {
              chapterData.words[wordIndex].isBookmarked = !chapterData.words[wordIndex].isBookmarked;
              localStorage.setItem(localStorageKey, JSON.stringify(chapterData));
            }
          }
        } catch (e) {
          console.error("Error updating bookmark in localStorage:", e);
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p>Loading quiz...</p>
        </main>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center">
            <p>No words available for quiz.</p>
            <Button onClick={handleReturnToSource} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to {quizSource === 'bookmarks' ? 'Bookmarks' : 'Chapter'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Show results page if quiz is completed
  if (showResults && quizResults) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <QuizResults
            score={quizResults.score}
            totalQuestions={quizResults.totalQuestions}
            correctAnswers={quizResults.correctAnswers}
            incorrectAnswers={quizResults.incorrectAnswers}
            skippedWords={quizResults.skippedWords}
            bookmarkedWords={quizResults.bookmarkedWords}
            onReview={handleReturnToSource}
            onRetakeAll={handleReattemptQuiz}
            onRetakeChallenging={handleReattemptQuiz}
            sessionSource={quizResults.sessionSource}
            onReattempt={handleReattemptQuiz}
          />
          <div className="mt-6 text-center">
            <Button onClick={handleReturnToSource} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Return to {quizSource === 'bookmarks' ? 'Bookmarks' : 'Chapter'}
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Use the advanced QuizMode component
  return (
    <QuizModeComponent
      words={words}
      onComplete={handleQuizComplete}
      onBookmarkToggle={handleBookmarkToggle}
    />
  );
};

export default QuizMode;
