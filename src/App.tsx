
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Chapters from "./pages/Chapters";
import ChapterDetail from "./pages/ChapterDetail";
import LearningPlans from "./pages/LearningPlans";
import DailyRevision from "./pages/DailyRevision";
import Bookmarks from "./pages/Bookmarks";
import Progress from "./pages/Progress";
import QuizMode from "./pages/QuizMode";
import Auth from "./pages/Auth";
import Sentences from "./pages/Sentences";
import TopikResources from "./pages/TopikResources";
import StudyTracker from "./pages/StudyTracker";

const queryClient = new QueryClient();

const App = () => {
  // Keep database active by making a simple query on app load
  useEffect(() => {
    const keepDatabaseActive = async () => {
      try {
        await supabase.from('chapters').select('count', { count: 'exact', head: true });
      } catch (error) {
        // Silently handle error - this is just to keep DB active
        console.log('Database keep-alive ping');
      }
    };
    
    keepDatabaseActive();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<Index />} />
            <Route path="/chapters" element={<Chapters />} />
            <Route path="/chapters/:chapterId" element={<ChapterDetail />} />
            <Route path="/sentences" element={<Sentences />} />
            <Route path="/topik-resources" element={<TopikResources />} />
            <Route path="/learning-plans" element={<LearningPlans />} />
            <Route path="/daily-revision" element={<DailyRevision />} />
            <Route path="/study-tracker" element={<StudyTracker />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/quiz/:chapterId" element={<QuizMode />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
