
import React, { useState, useEffect } from 'react';
import RevisionCard from '@/components/daily-revision/RevisionCard';
import { useToast } from '@/hooks/use-toast';

interface Word {
  id: string;
  word: string;
  definition: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  isBookmarked: boolean;
  isKnown?: boolean;
}

interface FlashcardModeProps {
  words: Word[];
  onComplete: (results: { correct: number; incorrect: number; skipped: number; total: number }) => void;
  onBack?: () => void;
  onBookmark?: (wordId: string) => void;
}

const FlashcardMode = ({ words, onComplete, onBack, onBookmark }: FlashcardModeProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<{ correct: number; incorrect: number; skipped: number }>({
    correct: 0,
    incorrect: 0,
    skipped: 0
  });
  const [activeWords, setActiveWords] = useState<Word[]>([]);
  const [isFlipped, setIsFlipped] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const wordsToLearn = words
      .filter(word => !word.isKnown)
      .sort((a, b) => {
        // Sort by priority (higher priority first)
        return ((b as any).priority || 3) - ((a as any).priority || 3);
      })
      .sort(() => 0.5 - Math.random());
    setActiveWords(wordsToLearn);
  }, [words]);

  const handleResult = (result: 'correct' | 'incorrect' | 'skipped') => {
    setResults(prev => ({
      ...prev,
      [result]: prev[result] + 1
    }));

    if (currentIndex < activeWords.length - 1) {
      setCurrentIndex(prevIndex => prevIndex + 1);
      setIsFlipped(false);
    } else {
      onComplete({
        ...results,
        [result]: results[result] + 1,
        total: activeWords.length
      });
    }
  };

  const handleBookmark = () => {
    if (onBookmark && activeWords.length > 0 && currentIndex < activeWords.length) {
      const currentWord = activeWords[currentIndex];
      
      // Update the current word's bookmarked state in the activeWords array
      const updatedWords = [...activeWords];
      updatedWords[currentIndex] = {
        ...currentWord,
        isBookmarked: !currentWord.isBookmarked
      };
      setActiveWords(updatedWords);
      
      // Call the parent component's onBookmark function
      onBookmark(currentWord.id);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeWords.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  if (activeWords.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500 mb-4">No words available for flashcards.</p>
      </div>
    );
  }

  if (currentIndex >= activeWords.length) {
    return null;
  }

  const currentWord = activeWords[currentIndex];

  return (
    <div className="w-full">
      <RevisionCard
        word={currentWord.word}
        translation={currentWord.definition}
        phonetic={currentWord.phonetic}
        example={currentWord.example}
        notes={currentWord.notes}
        isFlipped={isFlipped}
        onFlip={() => setIsFlipped(!isFlipped)}
        onResult={handleResult}
        onBookmark={handleBookmark}
        isBookmarked={currentWord.isBookmarked}
        currentIndex={currentIndex + 1}
        totalCards={activeWords.length}
        onBack={onBack}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
};

export default FlashcardMode;
