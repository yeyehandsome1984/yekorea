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
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      year: '2023',
      level: 'TOPIK II',
      type: 'Reading',
      question: '다음 글의 주제로 가장 알맞은 것을 고르십시오. (Choose the most appropriate topic for the following passage.)',
      answer: '환경 보호의 중요성 (The importance of environmental protection)',
      explanation: '이 글은 환경 문제와 그 해결 방법에 대해 설명하고 있습니다.'
    },
    {
      id: '2',
      year: '2023',
      level: 'TOPIK I',
      type: 'Listening',
      question: '남자는 무엇을 하려고 합니까? (What is the man trying to do?)',
      answer: '친구에게 전화하다 (Call a friend)',
      explanation: '대화에서 남자가 전화번호를 찾고 있는 것으로 확인됩니다.'
    },
    {
      id: '3',
      year: '2022',
      level: 'TOPIK II',
      type: 'Grammar',
      question: '다음 빈칸에 들어갈 가장 알맞은 것을 고르십시오: 날씨가 추워서 _____ 입었어요.',
      answer: '따뜻하게 (warmly)',
      explanation: '추운 날씨에 따뜻하게 입는 것이 자연스럽습니다.'
    }
  ]);
  const [essays, setEssays] = useState<Essay[]>([
    {
      id: '1',
      year: '2023',
      level: 'TOPIK II',
      topic: '최근의 환경 문제와 해결 방안',
      essayText: '최근 들어 환경 오염 문제가 심각해지고 있습니다. 특히 플라스틱 사용이 증가하면서 바다와 토양이 오염되고 있습니다.\n\n이 문제를 해결하기 위해서는 개인과 사회의 노력이 필요합니다. 개인적으로는 일회용품 사용을 줄이고 재활용을 생활화해야 합니다. 사회적으로는 환경 친화적인 제품 개발과 관련 법규를 강화해야 합니다.\n\n환경 보호는 우리 모두의 책임입니다. 작은 실천부터 시작하면 더 나은 미래를 만들 수 있을 것입니다.',
      score: '85/100',
      notes: '구조가 명확하고 논리적입니다. 어휘와 문법 사용이 적절합니다.'
    },
    {
      id: '2',
      year: '2022',
      level: 'TOPIK II',
      topic: '인터넷 사용의 장단점',
      essayText: '현대 사회에서 인터넷은 필수적인 도구가 되었습니다. 인터넷을 통해 정보를 쉽게 얻고 사람들과 소통할 수 있습니다.\n\n그러나 인터넷 사용에는 단점도 있습니다. 과도한 사용은 건강 문제를 일으킬 수 있고, 개인 정보 유출의 위험도 있습니다.\n\n따라서 인터넷의 장점을 활용하면서도 단점을 최소화하는 지혜로운 사용이 필요합니다.',
      score: '78/100',
      notes: '내용이 균형 있게 서술되었으나 구체적인 예시가 더 필요합니다.'
    }
  ]);
  const [topics, setTopics] = useState<EssayTopic[]>([
    {
      id: '1',
      year: '2023',
      level: 'TOPIK II',
      topic: '현대 사회에서 가족의 의미와 중요성',
      keywords: ['가족', '현대 사회', '변화', '관계', '가치']
    },
    {
      id: '2',
      year: '2023',
      level: 'TOPIK II',
      topic: '기술 발전이 일상생활에 미치는 영향',
      keywords: ['기술', '발전', '일상생활', '변화', '편리함']
    },
    {
      id: '3',
      year: '2022',
      level: 'TOPIK II',
      topic: '외국어 학습의 필요성과 방법',
      keywords: ['외국어', '학습', '방법', '필요성', '글로벌']
    },
    {
      id: '4',
      year: '2022',
      level: 'TOPIK II',
      topic: '건강한 생활을 위한 운동의 중요성',
      keywords: ['건강', '운동', '생활', '습관', '관리']
    },
    {
      id: '5',
      year: '2021',
      level: 'TOPIK II',
      topic: '대중교통 이용의 장점',
      keywords: ['대중교통', '환경', '경제', '편리', '도시']
    },
    {
      id: '6',
      year: '2021',
      level: 'TOPIK II',
      topic: '독서가 사람에게 주는 영향',
      keywords: ['독서', '영향', '지식', '사고', '성장']
    }
  ]);
  const [idioms, setIdioms] = useState<Idiom[]>([
    {
      id: '1',
      korean: '금상첨화 (錦上添花)',
      meaning: 'Adding flowers to brocade - making something good even better',
      example: '좋은 성적에 장학금까지 받다니 금상첨화네요!',
      category: 'Positive'
    },
    {
      id: '2',
      korean: '백문이불여일견 (百聞而不如一見)',
      meaning: 'Seeing once is better than hearing a hundred times',
      example: '한국 문화는 백문이불여일견입니다. 직접 경험해 보세요.',
      category: 'Wisdom'
    },
    {
      id: '3',
      korean: '일석이조 (一石二鳥)',
      meaning: 'Killing two birds with one stone',
      example: '운동하면서 친구도 만나니 일석이조예요.',
      category: 'Efficiency'
    },
    {
      id: '4',
      korean: '새옹지마 (塞翁之馬)',
      meaning: 'A blessing in disguise - fortune and misfortune are unpredictable',
      example: '시험에 떨어졌지만 새옹지마라고 더 좋은 기회가 올 거예요.',
      category: 'Philosophy'
    },
    {
      id: '5',
      korean: '호랑이도 제 말 하면 온다',
      meaning: 'Speak of the devil (lit. Even a tiger comes when you speak of it)',
      example: '진수 얘기하고 있었는데 호랑이도 제 말 하면 온다더니!',
      category: 'Common saying'
    },
    {
      id: '6',
      korean: '티끌 모아 태산',
      meaning: 'Many drops make a shower (lit. Dust gathered becomes a mountain)',
      example: '작은 저축이라도 티끌 모아 태산이니까 계속하세요.',
      category: 'Wisdom'
    },
    {
      id: '7',
      korean: '우물 안 개구리',
      meaning: 'A frog in a well - someone with limited perspective',
      example: '세계를 여행하면 우물 안 개구리에서 벗어날 수 있어요.',
      category: 'Perspective'
    },
    {
      id: '8',
      korean: '눈 코 뜰 새 없다',
      meaning: 'Too busy to even breathe',
      example: '시험 기간이라 눈 코 뜰 새 없이 바빠요.',
      category: 'Busyness'
    }
  ]);

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
