import React, { useState, useEffect } from 'react';
import Navbar from '@/components/layout/Navbar';
import StatsCard from '@/components/progress/StatsCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress as ProgressBar } from '@/components/ui/progress';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BookOpen, Users, Activity } from 'lucide-react';

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  progress: number;
  isBookmarked: boolean;
}

interface Word {
  id: string;
  word: string;
  definition: string;
  example?: string;
  notes?: string;
  phonetic?: string;
  isBookmarked: boolean;
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
  completedSets: string[];
}

const ProgressPage = () => {
  const [stats, setStats] = useState({
    totalWords: 0,
    learnedWords: 0,
    totalChapters: 0,
    completedChapters: 0,
    daysStreak: 7,
    wordsPerDay: 0,
  });
  
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadChapters();
    loadPlans();
  }, []);

  useEffect(() => {
    calculateStats();
  }, [chapters, plans]);

  const loadChapters = () => {
    const savedChapters = localStorage.getItem('lingualearn_chapters');
    if (savedChapters) {
      try {
        const parsedChapters = JSON.parse(savedChapters);
        
        const enhancedChapters = parsedChapters.map((chapter: Chapter) => {
          const chapterDataKey = `chapter_${chapter.id}`;
          const savedChapter = localStorage.getItem(chapterDataKey);
          
          if (savedChapter) {
            try {
              const chapterData = JSON.parse(savedChapter);
              const words = chapterData.words || [];
              const knownWords = words.filter((word: Word) => word.isBookmarked).length;
              const progress = words.length > 0 ? Math.round((knownWords / words.length) * 100) : 0;
              
              return {
                ...chapter,
                wordCount: words.length,
                progress: progress
              };
            } catch (e) {
              console.error(`Error parsing chapter data for ${chapter.id}:`, e);
            }
          }
          return chapter;
        });
        
        setChapters(enhancedChapters);
      } catch (e) {
        console.error("Error parsing chapters from localStorage:", e);
      }
    }
  };

  const loadPlans = () => {
    const savedPlans = localStorage.getItem('learning_plans');
    if (savedPlans) {
      try {
        const parsedPlans = JSON.parse(savedPlans);
        setPlans(parsedPlans);
      } catch (e) {
        console.error("Error parsing learning plans from localStorage:", e);
      }
    }
  };

  const calculateStats = () => {
    let totalWords = 0;
    let learnedWords = 0;
    
    chapters.forEach(chapter => {
      const chapterDataKey = `chapter_${chapter.id}`;
      const savedChapter = localStorage.getItem(chapterDataKey);
      
      if (savedChapter) {
        try {
          const chapterData = JSON.parse(savedChapter);
          const words = chapterData.words || [];
          totalWords += words.length;
          learnedWords += words.filter((word: Word) => word.isBookmarked).length;
        } catch (e) {
          console.error(`Error parsing chapter data for ${chapter.id}:`, e);
        }
      }
    });
    
    const completedChapters = chapters.filter(chapter => chapter.progress === 100).length;
    
    const wordsPerDay = Math.round(learnedWords / Math.max(1, stats.daysStreak));
    
    setStats({
      totalWords,
      learnedWords,
      totalChapters: chapters.length,
      completedChapters,
      daysStreak: stats.daysStreak,
      wordsPerDay,
    });
  };

  const pieData = [
    { name: 'Learned', value: stats.learnedWords },
    { name: 'Remaining', value: Math.max(0, stats.totalWords - stats.learnedWords) }
  ];
  
  const chapterProgressData = chapters
    .filter((_, idx) => idx < 7)
    .map(chapter => ({
      name: chapter.title.length > 15 ? chapter.title.substring(0, 15) + '...' : chapter.title,
      progress: chapter.progress
    }));
    
  const COLORS = ['#4f46e5', '#e5e7eb'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Progress</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Words Learned" 
            value={stats.learnedWords} 
            total={stats.totalWords} 
            icon={BookOpen}
            iconColor="bg-indigo-500"
          />
          <StatsCard 
            title="Chapters Completed" 
            value={stats.completedChapters} 
            total={stats.totalChapters} 
            icon={Users}
            iconColor="bg-emerald-500"
          />
          <StatsCard 
            title="Day Streak" 
            value={stats.daysStreak} 
            subtitle={`${stats.wordsPerDay} words/day`} 
            icon={Activity}
            iconColor="bg-orange-500"
          />
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="chapters">Chapters</TabsTrigger>
            <TabsTrigger value="plans">Learning Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4">Words Progress</h3>
                  <div className="h-64 flex items-center justify-center">
                    {stats.totalWords > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-400">No data available</p>
                    )}
                  </div>
                  
                  <div className="mt-4 text-center">
                    <p className="text-gray-500">
                      {stats.learnedWords} of {stats.totalWords} words learned
                    </p>
                    <ProgressBar 
                      value={stats.totalWords > 0 ? (stats.learnedWords / stats.totalWords) * 100 : 0} 
                      className="h-2 mt-2" 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-medium mb-4">Chapter Completion</h3>
                  <div className="h-64">
                    {chapterProgressData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chapterProgressData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 30,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                          <YAxis label={{ value: 'Progress %', angle: -90, position: 'insideLeft' }} />
                          <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                          <Bar dataKey="progress" fill="#4f46e5" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-gray-400">No chapters available</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="chapters" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Chapter Progress</h3>
                {chapters.length > 0 ? (
                  <div className="space-y-4">
                    {chapters.map(chapter => (
                      <div key={chapter.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <h4 className="font-medium">{chapter.title}</h4>
                            <p className="text-sm text-gray-500">{chapter.wordCount} words</p>
                          </div>
                          <p className="font-medium">{chapter.progress}%</p>
                        </div>
                        <ProgressBar 
                          value={chapter.progress} 
                          className="h-2" 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4">No chapters available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="plans" className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Learning Plans Progress</h3>
                {plans.length > 0 ? (
                  <div className="space-y-4">
                    {plans.map(plan => {
                      const progress = Math.round((plan.completedSets.length / plan.totalDays) * 100);
                      return (
                        <div key={plan.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex justify-between items-center mb-2">
                            <div>
                              <h4 className="font-medium">{plan.title}</h4>
                              <p className="text-sm text-gray-500">
                                {plan.completedSets.length} of {plan.totalDays} days completed
                                {plan.isActive && <span className="ml-2 text-blue-500">(Active)</span>}
                              </p>
                            </div>
                            <p className="font-medium">{progress}%</p>
                          </div>
                          <ProgressBar 
                            value={progress} 
                            className="h-2" 
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 py-4">No learning plans available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default ProgressPage;
