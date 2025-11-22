import React from 'react';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, CheckCircle, ChevronRight, Clock, Lock, Unlock, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
}

interface PlanSet {
  id: string;
  words: Word[];
  isCompleted: boolean;
  isUnlocked: boolean;
  flashcardCompleted: boolean;
  quizCompleted: boolean;
  dateUnlocked: string | null;
  dateCompleted: string | null;
  knownWordIds: string[];
  unknownWordIds: string[];
}

interface Plan {
  id: string;
  title: string;
  description: string;
  chapterId: string;
  chapterTitle: string;
  dailyWordGoal: number;
  totalWords: number;
  totalDays: number;
  createdAt: string;
  startedAt: string;
  currentSetIndex: number;
  isActive: boolean;
  sets: PlanSet[];
  completedSets: string[];
}

interface PlanDetailProps {
  plan: Plan;
  onBackClick: () => void;
  onUpdatePlan: (updatedPlan: Plan) => void;
  onDeletePlan: (id: string) => void;
}

const PlanDetail = ({ plan, onBackClick, onUpdatePlan, onDeletePlan }: PlanDetailProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const calculateDaysLeft = () => {
    const completedSetsCount = plan.completedSets.length;
    return plan.totalDays - completedSetsCount;
  };

  const calculateProgress = () => {
    const completedSetsCount = plan.completedSets.length;
    return Math.round((completedSetsCount / plan.totalDays) * 100);
  };

  const handleStartSession = (setIndex: number, showResults = false) => {
    if (!plan.sets[setIndex].isUnlocked) {
      toast({
        title: "Set Locked",
        description: "Complete the previous sets first to unlock this one.",
        variant: "destructive",
      });
      return;
    }
    
    // Check if the set has words
    if (!plan.sets[setIndex].words || plan.sets[setIndex].words.length === 0) {
      toast({
        title: "Empty Set",
        description: "This set doesn't have any words to review.",
        variant: "destructive",
      });
      return;
    }

    // If showResults is true and set is completed, navigate to show saved results
    if (showResults && plan.sets[setIndex].isCompleted) {
      const queryParams = new URLSearchParams({
        planId: plan.id,
        setIndex: setIndex.toString(),
        showSavedResults: 'true'
      });
      navigate(`/daily-revision?${queryParams.toString()}`);
      return;
    }

    // Original session start logic
    // If flashcards are completed but quiz is not, go directly to quiz mode
    if (plan.sets[setIndex].flashcardCompleted && !plan.sets[setIndex].quizCompleted) {
      navigate(`/daily-revision?planId=${plan.id}&setIndex=${setIndex}&mode=quiz`);
      return;
    }

    // Otherwise go to normal session (which starts with flashcards)
    navigate(`/daily-revision?planId=${plan.id}&setIndex=${setIndex}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" onClick={onBackClick} className="h-8 w-8 p-0">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{plan.title}</h2>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => onDeletePlan(plan.id)} 
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4 mr-1" /> Delete Plan
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">Progress</h3>
                <p className="text-sm text-gray-500">{calculateDaysLeft()} days left</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">{calculateProgress()}%</p>
                <p className="text-sm text-gray-500">completed</p>
              </div>
            </div>
            <Progress value={calculateProgress()} className="h-2 mt-4" />
          </CardContent>
        </Card>
        
        <Card className="flex-1">
          <CardContent className="pt-6">
            <div>
              <h3 className="font-medium">Chapter</h3>
              <p className="text-gray-500">{plan.chapterTitle}</p>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <p className="text-sm text-gray-500">Words</p>
                <p className="font-medium">{plan.totalWords}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Daily Goal</p>
                <p className="font-medium">{plan.dailyWordGoal}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <h3 className="font-medium text-lg mb-2">Daily Sets</h3>
      
      <div className="space-y-3">
        {plan.sets.map((set, index) => (
          <Card key={set.id} className={`transition-colors ${set.isCompleted ? 'bg-gray-50' : ''}`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {set.isCompleted ? (
                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ) : set.isUnlocked ? (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Unlock className="h-5 w-5 text-blue-600" />
                    </div>
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                      <Lock className="h-5 w-5 text-gray-500" />
                    </div>
                  )}
                  
                  <div>
                    <h4 className="font-medium">Set {index + 1}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      {set.words?.length || 0} words
                      {set.isCompleted ? (
                        <>
                          <span>·</span>
                          <div className="flex items-center text-green-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {set.dateCompleted ? format(new Date(set.dateCompleted), 'MMM d, yyyy') : 'Not completed'}
                          </div>
                        </>
                      ) : set.isUnlocked ? (
                        <>
                          <span>·</span>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(), 'MMM d, yyyy')}
                          </div>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
                
                {set.isCompleted ? (
                  <Button variant="outline" size="sm" onClick={() => handleStartSession(index, true)}>
                    Review Again
                  </Button>
                ) : set.isUnlocked ? (
                  <Button size="sm" onClick={() => handleStartSession(index)}>
                    Start Session
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" disabled>
                    Locked
                  </Button>
                )}
              </div>
              
              {(set.flashcardCompleted || set.quizCompleted) && !set.isCompleted && (
                <div className="mt-2 pt-2 border-t grid grid-cols-2 gap-2">
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${set.flashcardCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">
                      {set.flashcardCompleted ? (
                        <span className="flex items-center">
                          Flashcards Complete
                          <span className="ml-1 text-gray-500">
                            ({format(new Date(set.dateUnlocked || new Date()), 'MMM d')})
                          </span>
                        </span>
                      ) : 'Flashcards Pending'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`h-2 w-2 rounded-full ${set.quizCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span className="text-sm">
                      {set.quizCompleted ? (
                        <span className="flex items-center">
                          Quiz Complete
                          <span className="ml-1 text-gray-500">
                            ({format(new Date(set.dateCompleted || new Date()), 'MMM d')})
                          </span>
                        </span>
                      ) : 'Quiz Pending'}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PlanDetail;
