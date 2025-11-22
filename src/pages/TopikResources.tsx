import { useState } from "react";
import { GraduationCap, FileText, Lightbulb, MessageSquare, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import Navbar from "@/components/layout/Navbar";
import { toast } from "sonner";

interface Question {
  id: string;
  year: string;
  level: string;
  type: string;
  question: string;
  answer: string;
  explanation: string;
}

interface Essay {
  id: string;
  year: string;
  level: string;
  topic: string;
  essayText: string;
  score: string;
  notes: string;
}

interface EssayTopic {
  id: string;
  year: string;
  level: string;
  topic: string;
  keywords: string[];
}

interface Idiom {
  id: string;
  korean: string;
  meaning: string;
  example: string;
  category: string;
}

const TopikResources = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [essays, setEssays] = useState<Essay[]>([]);
  const [topics, setTopics] = useState<EssayTopic[]>([]);
  const [idioms, setIdioms] = useState<Idiom[]>([]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <GraduationCap className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">TOPIK Resources</h1>
            <p className="text-sm text-muted-foreground">
              Practice questions, essay samples, topics, and idioms for TOPIK preparation
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="questions" className="text-xs md:text-sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Sample Questions
            </TabsTrigger>
            <TabsTrigger value="essays" className="text-xs md:text-sm">
              <MessageSquare className="h-4 w-4 mr-1.5" />
              Essay Samples
            </TabsTrigger>
            <TabsTrigger value="topics" className="text-xs md:text-sm">
              <Lightbulb className="h-4 w-4 mr-1.5" />
              Essay Topics
            </TabsTrigger>
            <TabsTrigger value="idioms" className="text-xs md:text-sm">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Idioms
            </TabsTrigger>
          </TabsList>

          {/* Sample Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Past TOPIK Questions</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            {questions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No questions yet</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add sample TOPIK questions to practice
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {questions.map(q => (
                  <Card key={q.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{q.question}</CardTitle>
                          <CardDescription>
                            {q.year} • {q.level} • {q.type}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-muted-foreground">Answer:</span>
                          <p className="text-sm mt-1">{q.answer}</p>
                        </div>
                        {q.explanation && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">Explanation:</span>
                            <p className="text-sm mt-1">{q.explanation}</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Essay Samples Tab */}
          <TabsContent value="essays" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Past Year Essay Samples</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Essay
              </Button>
            </div>

            {essays.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No essays yet</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add sample essays from past TOPIK exams
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {essays.map(e => (
                  <Card key={e.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{e.topic}</CardTitle>
                          <CardDescription>
                            {e.year} • {e.level} • Score: {e.score}
                          </CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-line line-clamp-4">{e.essayText}</p>
                      {e.notes && (
                        <p className="text-xs text-muted-foreground mt-2">{e.notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Essay Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Past Essay Topics</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Topic
              </Button>
            </div>

            {topics.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No topics yet</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add essay topics that appeared in past TOPIK exams
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {topics.map(t => (
                  <Card key={t.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <CardTitle className="text-sm line-clamp-2">{t.topic}</CardTitle>
                          <CardDescription>{t.year} • {t.level}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    {t.keywords.length > 0 && (
                      <CardContent>
                        <div className="flex flex-wrap gap-1.5">
                          {t.keywords.map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {kw}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Idioms Tab */}
          <TabsContent value="idioms" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Korean Idioms (관용어)</h2>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Idiom
              </Button>
            </div>

            {idioms.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">No idioms yet</p>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    Add Korean idioms to expand your language knowledge
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {idioms.map(i => (
                  <Card key={i.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-base">{i.korean}</CardTitle>
                          <CardDescription>{i.meaning}</CardDescription>
                        </div>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Example:</span>
                        <p className="text-sm mt-1">{i.example}</p>
                      </div>
                      {i.category && (
                        <Badge variant="outline" className="mt-2">
                          {i.category}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TopikResources;
