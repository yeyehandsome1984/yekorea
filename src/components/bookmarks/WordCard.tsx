import React from 'react';
import { BookmarkMinus, Volume, BookmarkCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
interface WordCardProps {
  id: string;
  word: string;
  translation: string;
  phonetic?: string;
  chapter: string;
  onRemoveBookmark: (id: string) => void;
}
const WordCard = ({
  id,
  word,
  translation,
  phonetic,
  chapter,
  onRemoveBookmark
}: WordCardProps) => {
  const {
    toast
  } = useToast();
  const handlePlayAudio = () => {
    // In a real app, this would play audio for the word
    console.log('Playing audio for:', word);
    toast({
      title: "Audio playback",
      description: `Playing audio for: ${word}`
    });
  };
  const handleRemoveBookmark = () => {
    onRemoveBookmark(id);
    toast({
      title: "Bookmark removed",
      description: `"${word}" has been removed from your bookmarks.`
    });
  };
  return <Card className="hover:shadow-md transition-shadow duration-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-medium text-lg text-amber-500">{word}</h3>
            {phonetic && <p className="text-sm text-gray-500 italic">{phonetic}</p>}
          </div>
          <div className="flex space-x-1">
            
            <Button variant="ghost" size="sm" onClick={handleRemoveBookmark} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50">
              <BookmarkMinus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-blue-600">{translation}</p>
          <div className="flex items-center mt-2">
            <BookmarkCheck className="h-3.5 w-3.5 text-primary mr-1.5" />
            <p className="text-xs text-gray-500">From: {chapter}</p>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default WordCard;