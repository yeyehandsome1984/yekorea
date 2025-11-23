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

  return <Card className={`overflow-hidden transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`} onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-3">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2">{title}</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRenameClick}
            className="h-8 w-8 p-0 ml-2 flex-shrink-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-500 mb-4">{wordCount} words</p>
        <div className="space-y-2">
          
          <Progress value={progress} className="h-2" />
        </div>
      </CardContent>
    </Card>;
};
export default ChapterCard;