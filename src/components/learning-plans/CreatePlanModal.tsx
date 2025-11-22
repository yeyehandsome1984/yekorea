import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePlan: (plan: any) => void;
}

interface Chapter {
  id: string;
  title: string;
  description: string;
  wordCount: number;
  activeWordCount: number;
}

interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
  isKnown?: boolean;
}

const CreatePlanModal = ({ isOpen, onClose, onCreatePlan }: CreatePlanModalProps) => {
  const { toast } = useToast();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [dailyWordGoal, setDailyWordGoal] = useState(10);
  const [totalDays, setTotalDays] = useState(0);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [quizMode, setQuizMode] = useState('quiz-with-flashcard');

  // Load available chapters from localStorage
  useEffect(() => {
    try {
      // Get all keys from localStorage
      const keys = Object.keys(localStorage);
      // Filter for chapter keys
      const chapterKeys = keys.filter(key => key.startsWith('chapter_'));
      
      const loadedChapters: Chapter[] = [];
      
      chapterKeys.forEach(key => {
        try {
          const chapterData = JSON.parse(localStorage.getItem(key) || '{}');
          if (chapterData && chapterData.title) {
            // Count active (non-known) words
            const allWords = chapterData.words || [];
            const activeWords = allWords.filter((word: Word) => !word.isKnown);
            
            loadedChapters.push({
              id: key.replace('chapter_', ''),
              title: chapterData.title,
              description: chapterData.description || '',
              wordCount: chapterData.words ? chapterData.words.length : 0,
              activeWordCount: activeWords.length
            });
          }
        } catch (e) {
          console.error(`Error parsing chapter data for ${key}:`, e);
        }
      });
      
      setChapters(loadedChapters);
    } catch (e) {
      console.error('Error loading chapters:', e);
    }
  }, [isOpen]);

  // Update selected chapter when changed
  useEffect(() => {
    if (selectedChapterId) {
      const chapter = chapters.find(c => c.id === selectedChapterId);
      setSelectedChapter(chapter || null);
      
      if (chapter && chapter.activeWordCount > 0) {
        // Calculate total days based on active word count and daily goal
        const calculatedDays = Math.ceil(chapter.activeWordCount / dailyWordGoal);
        setTotalDays(calculatedDays);
      } else {
        setTotalDays(0);
      }
    } else {
      setSelectedChapter(null);
      setTotalDays(0);
    }
  }, [selectedChapterId, chapters, dailyWordGoal]);

  // Update total days when daily goal changes
  useEffect(() => {
    if (selectedChapter && selectedChapter.activeWordCount > 0) {
      const calculatedDays = Math.ceil(selectedChapter.activeWordCount / dailyWordGoal);
      setTotalDays(calculatedDays);
    }
  }, [dailyWordGoal, selectedChapter]);

  const handleCreatePlan = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your learning plan.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChapterId || !selectedChapter) {
      toast({
        title: "Chapter Required",
        description: "Please select a chapter for your learning plan.",
        variant: "destructive",
      });
      return;
    }

    if (selectedChapter.activeWordCount === 0) {
      toast({
        title: "No Active Words",
        description: "The selected chapter doesn't contain any active words to learn. All words are marked as known.",
        variant: "destructive",
      });
      return;
    }

    // Generate daily sets
    const sets = generateDailySets(selectedChapter, dailyWordGoal);
    
    // Create the plan object
    const newPlan = {
      id: `plan_${Date.now()}`,
      title,
      description,
      chapterId: selectedChapterId,
      chapterTitle: selectedChapter.title,
      dailyWordGoal,
      totalWords: selectedChapter.activeWordCount,
      totalDays,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      currentSetIndex: 0,
      isActive: true,
      quizMode,
      sets,
      completedSets: []
    };
    
    onCreatePlan(newPlan);
    
    // Reset form
    setTitle('');
    setDescription('');
    setSelectedChapterId('');
    setDailyWordGoal(10);
    setQuizMode('quiz-with-flashcard');
    
    onClose();
  };

  // Generate daily sets from the chapter words
  const generateDailySets = (chapter: Chapter, dailyGoal: number) => {
    try {
      // Get chapter data from localStorage
      const chapterData = JSON.parse(localStorage.getItem(`chapter_${chapter.id}`) || '{}');
      
      if (!chapterData.words || !Array.isArray(chapterData.words)) {
        throw new Error("No words found in chapter");
      }
      
      // Filter out known words
      const activeWords = chapterData.words.filter((word: Word) => !word.isKnown);
      
      if (activeWords.length === 0) {
        toast({
          title: "No Active Words",
          description: "All words in this chapter are marked as known. There are no words to learn.",
          variant: "destructive",
        });
        return [];
      }
      
      const sets = [];
      
      // Create sets with daily goal words each
      for (let i = 0; i < activeWords.length; i += dailyGoal) {
        const setWords = activeWords.slice(i, i + dailyGoal);
        sets.push({
          id: `set_${i/dailyGoal}`,
          words: setWords,
          isCompleted: false,
          isUnlocked: i === 0, // Only first set is unlocked initially
          flashcardCompleted: false,
          quizCompleted: false,
          dateUnlocked: i === 0 ? new Date().toISOString() : null,
          dateCompleted: null,
          knownWordIds: [],
          unknownWordIds: [],
        });
      }
      
      return sets;
    } catch (e) {
      console.error('Error generating daily sets:', e);
      toast({
        title: "Error Creating Plan",
        description: "Failed to generate daily sets from chapter words.",
        variant: "destructive",
      });
      return [];
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Learning Plan</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Plan Title</Label>
            <Input
              id="title"
              placeholder="Enter plan title (e.g., Synonyms, Antonyms)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              placeholder="Enter plan description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="chapter">Select Chapter</Label>
            <Select value={selectedChapterId} onValueChange={setSelectedChapterId}>
              <SelectTrigger id="chapter" className="w-full">
                <SelectValue placeholder="Select a chapter" />
              </SelectTrigger>
              <SelectContent>
                {chapters.length > 0 ? (
                  chapters.map((chapter) => (
                    <SelectItem key={chapter.id} value={chapter.id}>
                      {chapter.title} ({chapter.activeWordCount} active words of {chapter.wordCount} total)
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-chapters" disabled>
                    No chapters available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {selectedChapter && selectedChapter.activeWordCount === 0 && (
              <p className="text-xs text-red-500">
                This chapter has no active words to learn. All words are marked as known.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="quiz-mode">Learning Mode</Label>
            <Select value={quizMode} onValueChange={setQuizMode}>
              <SelectTrigger id="quiz-mode" className="w-full">
                <SelectValue placeholder="Select learning mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="quiz-with-flashcard">
                  Quiz with Flashcard (Complete both to finish set)
                </SelectItem>
                <SelectItem value="only-quiz">
                  Only Quiz (Skip flashcard mode)
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              {quizMode === 'only-quiz' 
                ? 'Sets will be completed after taking the quiz only'
                : 'Sets require both flashcard review and quiz completion'
              }
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Words Per Day: {dailyWordGoal}</Label>
              <span className="text-sm text-muted-foreground">
                {totalDays > 0 ? `${totalDays} days total` : ''}
              </span>
            </div>
            <Slider
              value={[dailyWordGoal]}
              min={5}
              max={selectedChapter?.activeWordCount || 20}
              step={1}
              onValueChange={(values) => setDailyWordGoal(values[0])}
              disabled={!selectedChapter || selectedChapter.activeWordCount === 0}
            />
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" /> Cancel
          </Button>
          <Button onClick={handleCreatePlan} disabled={!selectedChapter || selectedChapter.activeWordCount === 0}>
            <Check className="h-4 w-4 mr-2" /> Create Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePlanModal;
