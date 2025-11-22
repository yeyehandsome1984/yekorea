
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brain, CheckCircle, Calendar, ArrowRight, Sparkles, BookText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import Navbar from '@/components/layout/Navbar';
import { useSmartRevision } from '@/components/revision/SmartRevisionGenerator';
import SmartRevisionLogo from '@/components/revision/SmartRevisionLogo';

const SmartRevision = () => {
  const navigate = useNavigate();
  const { getSmartRevisionSets, generateSmartRevisionSet, isGenerating } = useSmartRevision();
  const [revisionSets, setRevisionSets] = useState<any[]>([]);
  
  useEffect(() => {
    // Load smart revision sets when component mounts
    setRevisionSets(getSmartRevisionSets());
  }, []);
  
  const handleGenerateNewSet = async () => {
    const success = await generateSmartRevisionSet();
    if (success) {
      // Refresh sets after generation
      setRevisionSets(getSmartRevisionSets());
    }
  };
  
  const handleStartSession = (setId: string) => {
    navigate(`/daily-revision?setId=${setId}&source=smart-revision`);
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <SmartRevisionLogo 
              size="lg" 
              backgroundImage="/smart-revision-bg.png" 
            />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Smart Revision</h1>
          <p className="text-gray-500 max-w-lg mx-auto">
            AI-powered revision sets generated from your learning history, focusing on words you find challenging.
          </p>
        </div>
        
        <div className="grid grid-cols-1 gap-8">
          {revisionSets.length === 0 ? (
            <Card className="text-center">
              <CardContent className="pt-12 pb-12">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold mb-2">No Smart Revision Sets</h2>
                <p className="text-gray-500 mb-6">
                  Smart Revision analyzes your learning history to create personalized practice sets.
                  Keep using the app to generate your first set!
                </p>
                <Button 
                  onClick={handleGenerateNewSet} 
                  disabled={isGenerating}
                  className="mx-auto"
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Generate Revision Set
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Your Revision Sets</h2>
                <Button 
                  variant="outline" 
                  onClick={handleGenerateNewSet}
                  disabled={isGenerating}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Generate New Set
                </Button>
              </div>
              
              <div className="space-y-4">
                {revisionSets.map((set) => (
                  <Card 
                    key={set.id} 
                    className={`transition-all duration-200 hover:shadow-md ${set.completed ? 'bg-gray-50' : ''}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-start space-x-3">
                          <div className={`p-2 rounded-full ${set.completed ? 'bg-green-100' : 'bg-blue-100'}`}>
                            {set.completed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Brain className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">
                              Smart Revision Set
                              {set.completed ? " (Completed)" : ""}
                            </h3>
                            <div className="flex items-center text-sm text-gray-500 mt-1">
                              <Calendar className="h-3.5 w-3.5 mr-1.5" />
                              {new Date(set.date).toLocaleDateString()}
                              <span className="mx-1.5">•</span>
                              <BookText className="h-3.5 w-3.5 mr-1.5" />
                              {set.words.length} words
                            </div>
                          </div>
                        </div>
                        <Button 
                          variant={set.completed ? "outline" : "default"} 
                          size="sm"
                          onClick={() => handleStartSession(set.id)}
                        >
                          {set.completed ? "Review Again" : "Start Review"}
                          {!set.completed && <ArrowRight className="ml-1 h-4 w-4" />}
                        </Button>
                      </div>
                      
                      <Progress 
                        value={set.completed ? 100 : 0} 
                        className="h-1.5" 
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SmartRevision;
