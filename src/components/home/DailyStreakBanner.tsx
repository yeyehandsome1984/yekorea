
import React from 'react';
import { Flame, Trophy, Brain } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const DailyStreakBanner = () => {
  const navigate = useNavigate();
  
  // Get streak information from localStorage
  const getStreakInfo = () => {
    try {
      const streakStr = localStorage.getItem('learning_streak');
      if (streakStr) {
        return JSON.parse(streakStr);
      }
    } catch (e) {
      console.error("Error loading streak info:", e);
    }
    return { streak: 0, lastDate: '', progress: 0 };
  };
  
  const { streak, progress } = getStreakInfo();
  
  // Check if daily revision was completed today
  const isDailyRevisionCompleted = () => {
    try {
      const sessionsStr = localStorage.getItem('revision_sessions');
      if (!sessionsStr) return false;
      
      const sessions = JSON.parse(sessionsStr);
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      return sessions.some((session: any) => {
        const sessionDate = new Date(session.date).toISOString().split('T')[0];
        return sessionDate === today && session.completed;
      });
    } catch (e) {
      console.error("Error checking daily revision completion:", e);
      return false;
    }
  };
  
  const completed = isDailyRevisionCompleted();
  const displayProgress = progress || 0;

  return (
    <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="bg-amber-500 p-1.5 rounded-full">
            <Flame className="h-5 w-5 text-white" />
          </div>
          <h3 className="font-medium text-gray-900">{streak} Day Streak</h3>
        </div>
        <div className="flex items-center space-x-1">
          <Trophy className="h-4 w-4 text-amber-500" />
          <span className="text-sm text-gray-500">Level {Math.floor(streak / 7) + 1}</span>
        </div>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-xs text-gray-500">
          <span>Today's Goal</span>
          <span>{displayProgress}%</span>
        </div>
        <Progress value={displayProgress} className="h-2" />
      </div>
      
      <Button 
        onClick={() => navigate('/daily-revision')}
        className="w-full"
        disabled={completed}
      >
        <Brain className="h-4 w-4 mr-2" />
        {completed ? "Today's Review Complete" : "Start Daily Review"}
      </Button>
    </div>
  );
};

export default DailyStreakBanner;
