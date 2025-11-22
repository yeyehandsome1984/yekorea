"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp, ChevronDown, Moon, Sun } from "lucide-react";
import { useState, useEffect, useRef } from "react";
interface Question {
  id: number;
  question: string;
  series?: string;
  options: string[];
  answered?: boolean;
  marked?: boolean;
  starred?: boolean;
  visited?: boolean;
  selectedAnswer?: number | null;
  timeSpent?: number;
}
interface QuestionGridProps {
  questions: Question[];
  currentQuestion: number;
  onQuestionSelect: (index: number) => void;
  onSubmitTest: () => void;
  isTestPaused?: boolean;
  isDarkMode?: boolean;
  onDarkModeToggle?: () => void;
}
export default function QuestionGrid({
  questions,
  currentQuestion,
  onQuestionSelect,
  onSubmitTest,
  isTestPaused = false,
  isDarkMode = false,
  onDarkModeToggle
}: QuestionGridProps) {
  const [showGridScroll, setShowGridScroll] = useState(false);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Show scroll buttons only if there are more than 40 questions
  useEffect(() => {
    setShowGridScroll(questions.length > 40);
  }, [questions]);
  const scrollGrid = (direction: 'up' | 'down') => {
    if (gridContainerRef.current) {
      const scrollAmount = 150;
      const currentScroll = gridContainerRef.current.scrollTop;
      const newScroll = direction === 'up' ? Math.max(0, currentScroll - scrollAmount) : currentScroll + scrollAmount;
      gridContainerRef.current.scrollTo({
        top: newScroll,
        behavior: 'smooth'
      });
    }
  };
  const getQuestionStatus = (question: Question, index: number) => {
    let baseClasses = "w-10 h-10 rounded-full text-sm font-medium transition-all";

    // Always add blue border for current question
    if (index === currentQuestion) {
      baseClasses += " ring-2 ring-blue-500 ring-offset-2";
    }

    // Green for answered/attempted questions
    if (question.answered || question.selectedAnswer !== null) {
      return `${baseClasses} bg-green-500 text-white hover:bg-green-600`;
    }

    // Red for visited but not attempted
    if (question.visited && !question.answered && question.selectedAnswer === null) {
      return `${baseClasses} bg-red-500 text-white hover:bg-red-600`;
    }

    // Yellow for marked questions
    if (question.marked) {
      return `${baseClasses} bg-yellow-500 text-white hover:bg-yellow-600`;
    }

    // Blue for starred questions
    if (question.starred) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }

    // White for default/unattempted questions - updated for dark mode
    return `${baseClasses} ${isDarkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600 border border-gray-600' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'}`;
  };
  const answeredCount = questions.filter(q => q.answered).length;
  const visitedCount = questions.filter(q => q.visited).length;
  const markedCount = questions.filter(q => q.marked).length;
  const starredCount = questions.filter(q => q.starred).length;
  return <div className={`p-4 h-full flex flex-col transition-colors ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Questions</h2>
        {onDarkModeToggle && <Button variant="ghost" size="sm" onClick={onDarkModeToggle} className="py-0 px-px my-0 mx-[39px]">
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>}
      </div>

      {/* Question Grid with custom scrollbar - extended height */}
      <div className="flex-1 mb-4 min-h-0">
        <div className="h-full w-full overflow-y-auto" style={{
        maxHeight: '550px',
        scrollbarWidth: 'thin',
        scrollbarColor: isDarkMode ? '#4a5568 #2d3748' : '#888 #f1f1f1'
      }}>
          <style>{`
            .question-grid::-webkit-scrollbar {
              width: 10px;
            }
            .question-grid::-webkit-scrollbar-track {
              background: ${isDarkMode ? '#2d3748' : '#f1f1f1'};
            }
            .question-grid::-webkit-scrollbar-thumb {
              background: ${isDarkMode ? '#4a5568' : '#888'};
              border-radius: 5px;
            }
            .question-grid::-webkit-scrollbar-thumb:hover {
              background: ${isDarkMode ? '#718096' : '#555'};
            }
          `}</style>
          <div className="grid grid-cols-5 gap-2 p-1 question-grid">
            {questions.map((question, index) => <Button key={question.id} onClick={() => onQuestionSelect(index)} className={getQuestionStatus(question, index)} variant="ghost">
                {question.id}
              </Button>)}
          </div>
        </div>
      </div>

      {/* Submit button fixed at bottom with more space from edge */}
      <div className={`mt-auto pb-4 ${isDarkMode ? 'bg-transparent' : 'bg-transparent'}`}>
        <div className="flex gap-2 w-full">
          <Button onClick={onSubmitTest} disabled={isTestPaused} className={`flex-1 ${isTestPaused ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} text-white`}>
            {isTestPaused ? 'Resume Test to Submit' : 'Submit Test'}
          </Button>
        </div>
      </div>
    </div>;
}