import React from 'react';
import { Bookmark, BookmarkX, Edit2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
interface ChapterCardProps {
  id: string;
  title: string;
  wordCount: number;
  progress: number;
  isBookmarked: boolean;
  onToggleBookmark: (id: string) => void;
  onRename: (id: string) => void;
  onClick?: () => void;
}
const ChapterCard = ({
  id,
  title,
  wordCount,
  progress,
  isBookmarked,
  onToggleBookmark,
  onRename,
  onClick
}: ChapterCardProps) => {
  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleBookmark(id);
  };

  const handleRenameClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRename(id);
  };

  return <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md active:scale-[0.98] ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-2 sm:mb-3">
          <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-2 leading-tight">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRenameClick}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 ml-2 flex-shrink-0 touch-target"
          >
            <Edit2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
        <p className="text-xs sm:text-sm text-gray-500 mb-3 sm:mb-4">{wordCount} words</p>
        <div className="space-y-2">
          
          <Progress value={progress} className="h-1.5 sm:h-2" />
        </div>
      </CardContent>
    </Card>;
};
export default ChapterCard;