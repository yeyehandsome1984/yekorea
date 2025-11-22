
import React from 'react';
import { Calendar, CheckCircle, Trash2 } from 'lucide-react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PlanCardProps {
  id: string;
  title: string;
  description: string;
  daysLeft: number;
  chaptersCompleted: number;
  totalChapters: number;
  active?: boolean;
  onViewClick: () => void;
  onActivateClick: () => void;
  onDeleteClick: () => void;
}

const PlanCard = ({ 
  id, 
  title, 
  description, 
  daysLeft, 
  chaptersCompleted,
  totalChapters,
  active = false,
  onViewClick,
  onActivateClick,
  onDeleteClick
}: PlanCardProps) => {
  const progress = Math.round((chaptersCompleted / totalChapters) * 100);
  
  return (
    <Card className={`card-hover ${active ? 'border-primary border-2' : ''}`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-lg">{title}</h3>
          <div className="flex items-center gap-2">
            {active && (
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                Active
              </Badge>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={(e) => {
                e.stopPropagation();
                onDeleteClick();
              }}
              className="h-8 w-8 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">{description}</p>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <div className="flex items-center text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              <span>{daysLeft} days left</span>
            </div>
            <div className="flex items-center text-gray-500">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>{chaptersCompleted}/{totalChapters} days</span>
            </div>
          </div>
          
          <div className="bg-gray-100 h-2 rounded-full">
            <div 
              className="bg-primary h-2 rounded-full" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-xs text-right text-gray-500">
            {progress}% complete
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="pt-0 flex gap-2">
        <Button 
          className="flex-1"
          variant={active ? "default" : "outline"}
          onClick={onViewClick}
        >
          View Plan
        </Button>
        {!active && (
          <Button
            variant="outline"
            onClick={onActivateClick}
            className="flex-1"
          >
            Activate
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlanCard;
