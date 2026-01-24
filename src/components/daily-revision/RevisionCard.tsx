import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Check, X, Star, StarOff, Search, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import WordMeaningDialog from './WordMeaningDialog';
import { speakKorean } from '@/utils/textToSpeech';
interface RevisionCardProps {
  word: string;
  translation: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  isFlipped: boolean;
  onFlip: () => void;
  onResult: (result: 'correct' | 'incorrect' | 'skipped') => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  currentIndex?: number;
  totalCards?: number;
  onBack?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}
const RevisionCard = ({
  word,
  translation,
  phonetic,
  example,
  notes,
  isFlipped,
  onFlip,
  onResult,
  onBookmark,
  isBookmarked = false,
  currentIndex = 1,
  totalCards = 1,
  onBack,
  onNext,
  onPrevious
}: RevisionCardProps) => {
  const {
    toast
  } = useToast();
  const [showMeaningDialog, setShowMeaningDialog] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const handlePlayAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    speakKorean(word);
  };
  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBookmark) {
      onBookmark();
      toast({
        title: isBookmarked ? "Bookmark removed" : "Bookmark added",
        description: isBookmarked ? `"${word}" has been removed from your bookmarks.` : `"${word}" has been added to your bookmarks.`
      });
    }
  };
  const handleCheckMeaning = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMeaningDialog(true);
  };

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };
  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const deltaX = touchStart.x - touchEnd.x;
    const deltaY = touchStart.y - touchEnd.y;
    const minSwipeDistance = 50;

    // Only process horizontal swipes if they're more significant than vertical
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
      if (isFlipped) {
        // When card is flipped, swipe to mark as correct/incorrect
        if (deltaX > 0) {
          // Swipe left - Unknown/Incorrect
          onResult('incorrect');
        } else {
          // Swipe right - Known/Correct
          onResult('correct');
        }
      } else {
        // When card is not flipped, swipe to navigate between cards
        if (deltaX > 0) {
          // Swipe left - Next card
          onNext?.();
        } else {
          // Swipe right - Previous card
          onPrevious?.();
        }
      }
    }
  };
  const progress = currentIndex / totalCards * 100;
  return <div className="w-full max-w-2xl mx-auto px-3 sm:px-4">
      <div className="mb-4 sm:mb-8 my-3 sm:my-5">
        {onBack && <Button variant="ghost" onClick={onBack} className="flex items-center text-gray-600 touch-target h-10 sm:h-9 mb-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>}
        <div className="text-xs sm:text-sm text-gray-500 mb-2">
          Card {currentIndex} of {totalCards}
        </div>
        <div className="h-1.5 sm:h-1 w-full bg-gray-100 rounded overflow-hidden">
          <div className="h-full bg-blue-500 transition-all duration-300" style={{
          width: `${progress}%`
        }} />
        </div>
      </div>

      <Card ref={cardRef} onClick={onFlip} className="cursor-pointer relative active:scale-[0.99] transition-transform" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6 min-h-[200px] sm:min-h-[250px] flex flex-col items-center justify-center">
          <div className="absolute top-2 sm:top-4 right-2 sm:right-4 flex space-x-1 sm:space-x-2">
            <Button variant="ghost" size="sm" onClick={handleCheckMeaning} className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-target">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            </Button>
            {onBookmark && <Button variant="ghost" size="sm" onClick={handleBookmarkToggle} className="h-9 w-9 sm:h-8 sm:w-8 p-0 touch-target">
                {isBookmarked ? <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" /> : <StarOff className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />}
              </Button>}
          </div>
          
          <div className="flex flex-col items-center justify-center p-3 sm:p-4 text-center">
            {!isFlipped ? <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-2xl sm:text-4xl font-bold text-gray-900">{word}</h2>
                <Button variant="ghost" size="sm" onClick={handlePlayAudio} className="h-10 w-10 p-0 touch-target">
                  <Volume2 className="h-5 w-5 sm:h-6 sm:w-6" />
                </Button>
              </div> : <div className="space-y-3 sm:space-y-4 text-center">
                <h3 className="font-bold text-red-600 text-xl sm:text-2xl">{word}</h3>
                <div className="space-y-1.5 sm:space-y-2">
                  {phonetic && <p className="text-gray-600 font-medium text-sm sm:text-base">Meaning: {phonetic}</p>}
                  <p className="text-gray-900 text-lg sm:text-xl font-bold">Definition: {translation}</p>
                </div>
                {example && <p className="text-gray-600 italic mt-3 sm:mt-4 text-sm sm:text-base">"{example}"</p>}
                {notes && <p className="text-xs sm:text-sm text-gray-500 mt-2">{notes}</p>}
              </div>}
          </div>
        </CardContent>

        {isFlipped && <CardFooter className="p-2 sm:p-3 flex justify-between items-center gap-2 sm:gap-3">
            {/* Unknown/Incorrect button on left */}
            <Button variant="outline" onClick={e => {
          e.stopPropagation();
          onResult('incorrect');
        }} size="sm" className="flex-1 max-w-[140px] bg-white border-red-500 text-red-500 hover:bg-red-50 active:bg-red-100 text-xs sm:text-sm py-2.5 sm:py-2 animate-fade-in mx-2 sm:mx-5 touch-target h-11 sm:h-10">
              <X className="h-4 w-4 mr-1" /> Unknown
            </Button>
            
            {/* Known/Correct button on right */}
            <Button onClick={e => {
          e.stopPropagation();
          onResult('correct');
        }} size="sm" className="flex-1 max-w-[140px] bg-green-500 text-white hover:bg-green-600 active:bg-green-700 text-xs sm:text-sm py-2.5 sm:py-2 animate-fade-in my-0 mx-2 sm:mx-5 touch-target h-11 sm:h-10">
              <Check className="h-4 w-4 mr-1" /> Known
            </Button>
          </CardFooter>}
      </Card>

      <WordMeaningDialog word={word} open={showMeaningDialog} onOpenChange={setShowMeaningDialog} />
    </div>;
};
export default RevisionCard;