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
  // Dialog states
  const [openQuestionDialog, setOpenQuestionDialog] = useState(false);
  const [openEssayDialog, setOpenEssayDialog] = useState(false);
  const [openTopicDialog, setOpenTopicDialog] = useState(false);
  const [openIdiomDialog, setOpenIdiomDialog] = useState(false);

  // Form states for new items
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({});
  const [newEssay, setNewEssay] = useState<Partial<Essay>>({});
  const [newTopic, setNewTopic] = useState<Partial<EssayTopic>>({ keywords: [] });
  const [newIdiom, setNewIdiom] = useState<Partial<Idiom>>({});
  const [keywordInput, setKeywordInput] = useState('');

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
    },
    {
      id: '3',
      year: '2023',
      level: 'TOPIK II',
      topic: '한국의 전통 문화 보존의 중요성',
      essayText: '한국은 오랜 역사를 가진 나라로 다양한 전통 문화를 보유하고 있습니다. 한복, 한글, 전통 음악 등은 한국의 정체성을 나타내는 중요한 문화유산입니다.\n\n그러나 현대화가 진행되면서 많은 전통 문화가 사라질 위기에 처해 있습니다. 젊은 세대는 전통 문화에 대한 관심이 적고, 서양 문화를 더 선호하는 경향이 있습니다.\n\n따라서 전통 문화를 보존하고 계승하기 위한 노력이 필요합니다. 학교에서 전통 문화 교육을 강화하고, 정부는 전통 문화 행사를 지원해야 합니다. 또한 전통과 현대를 접목한 새로운 문화 콘텐츠를 개발하여 젊은 세대의 관심을 끌어야 합니다.',
      score: '90/100',
      notes: '주제를 잘 이해하고 있으며 구체적인 해결 방안을 제시했습니다.'
    },
    {
      id: '4',
      year: '2023',
      level: 'TOPIK II',
      topic: '대중교통 이용의 장점과 활성화 방안',
      essayText: '도시화가 진행되면서 교통 체증이 심각한 문제가 되고 있습니다. 이를 해결하기 위해 대중교통 이용을 활성화해야 합니다.\n\n대중교통은 여러 장점이 있습니다. 첫째, 환경 보호에 도움이 됩니다. 많은 사람이 한 번에 이동하므로 자동차 배기가스가 줄어듭니다. 둘째, 경제적입니다. 자동차를 소유하고 유지하는 비용보다 저렴합니다.\n\n대중교통 이용을 활성화하기 위해서는 편리성을 높여야 합니다. 노선을 확대하고 배차 간격을 줄여야 합니다. 또한 요금을 합리적으로 조정하고 환승 시스템을 개선해야 합니다.',
      score: '82/100',
      notes: '장점을 명확히 제시했으나 실제 사례가 더 있으면 좋겠습니다.'
    },
    {
      id: '5',
      year: '2022',
      level: 'TOPIK II',
      topic: '스마트폰 사용이 청소년에게 미치는 영향',
      essayText: '스마트폰은 현대인의 필수품이 되었습니다. 특히 청소년들의 스마트폰 사용률이 매우 높습니다.\n\n스마트폰은 유용한 도구이지만 과도한 사용은 문제가 됩니다. 학업에 집중하지 못하고 시력이 나빠질 수 있습니다. 또한 SNS에서의 비교와 경쟁으로 스트레스를 받을 수 있습니다.\n\n청소년의 건강한 스마트폰 사용을 위해서는 부모와 교사의 지도가 필요합니다. 사용 시간을 제한하고 올바른 사용 방법을 교육해야 합니다. 또한 청소년 스스로도 자제력을 기르는 것이 중요합니다.',
      score: '80/100',
      notes: '현실적인 문제와 해결책을 제시했습니다.'
    },
    {
      id: '6',
      year: '2022',
      level: 'TOPIK II',
      topic: '원격 근무의 장단점',
      essayText: '코로나19 이후 원격 근무가 일반화되었습니다. 집에서 일하는 것은 장단점이 모두 있습니다.\n\n장점으로는 출퇴근 시간을 절약할 수 있고 편안한 환경에서 일할 수 있습니다. 또한 업무와 가정생활의 균형을 맞추기 쉽습니다.\n\n그러나 단점도 있습니다. 동료들과의 소통이 어렵고 업무와 개인 생활의 경계가 모호해집니다. 또한 집중력이 떨어질 수 있습니다.\n\n효과적인 원격 근무를 위해서는 규칙적인 일과를 유지하고 온라인 회의 도구를 적극 활용해야 합니다.',
      score: '84/100',
      notes: '균형 잡힌 시각으로 주제를 다루었습니다.'
    },
    {
      id: '7',
      year: '2022',
      level: 'TOPIK II',
      topic: '건강한 식습관의 중요성',
      essayText: '현대인들은 바쁜 생활로 인해 불규칙한 식사를 하는 경우가 많습니다. 건강한 식습관은 우리 삶의 질을 높이는 중요한 요소입니다.\n\n좋은 식습관은 여러 이점이 있습니다. 균형 잡힌 영양 섭취로 질병을 예방할 수 있고 에너지를 얻을 수 있습니다. 또한 정신 건강에도 긍정적인 영향을 줍니다.\n\n건강한 식습관을 위해서는 규칙적으로 식사하고 다양한 식품을 섭취해야 합니다. 가공식품과 패스트푸드는 줄이고 신선한 재료로 직접 요리하는 것이 좋습니다.',
      score: '79/100',
      notes: '실천 가능한 방법을 제시했습니다.'
    },
    {
      id: '8',
      year: '2021',
      level: 'TOPIK II',
      topic: '평생 교육의 필요성',
      essayText: '급변하는 현대 사회에서 평생 교육의 중요성이 커지고 있습니다. 학교를 졸업한 후에도 지속적으로 배우는 것이 필요합니다.\n\n평생 교육은 개인의 경쟁력을 높입니다. 새로운 기술과 지식을 습득하여 직업 능력을 향상시킬 수 있습니다. 또한 자아실현과 삶의 만족도를 높이는 데 도움이 됩니다.\n\n평생 교육을 활성화하기 위해서는 다양한 교육 프로그램을 제공해야 합니다. 온라인 교육을 확대하고 직장인을 위한 야간 강좌를 개설해야 합니다. 정부는 평생 교육 기관을 지원하고 학습 비용을 보조해야 합니다.',
      score: '88/100',
      notes: '체계적으로 논지를 전개했습니다.'
    },
    {
      id: '9',
      year: '2021',
      level: 'TOPIK II',
      topic: '독서의 가치와 독서 습관 형성 방법',
      essayText: '디지털 시대에도 독서는 여전히 중요한 활동입니다. 책을 읽는 것은 단순한 취미를 넘어 삶을 풍요롭게 만듭니다.\n\n독서는 많은 이점이 있습니다. 지식과 정보를 얻을 수 있고 상상력과 창의력이 발달합니다. 또한 독서는 스트레스 해소에도 도움이 됩니다.\n\n좋은 독서 습관을 형성하기 위해서는 매일 일정 시간을 독서에 할애해야 합니다. 자신의 관심사에 맞는 책을 선택하고 독서 모임에 참여하는 것도 좋은 방법입니다. 도서관과 서점을 자주 방문하여 독서 환경을 조성하는 것이 중요합니다.',
      score: '86/100',
      notes: '구체적인 방법을 잘 제시했습니다.'
    },
    {
      id: '10',
      year: '2021',
      level: 'TOPIK II',
      topic: '여가 활동의 중요성과 활용 방안',
      essayText: '바쁜 현대 사회에서 여가 활동은 매우 중요합니다. 일과 휴식의 균형을 맞추는 것이 건강한 삶의 핵심입니다.\n\n여가 활동은 여러 긍정적인 효과가 있습니다. 스트레스를 해소하고 심신을 재충전할 수 있습니다. 또한 새로운 사람을 만나고 취미를 개발할 수 있습니다.\n\n여가 시간을 효과적으로 활용하기 위해서는 계획을 세워야 합니다. 운동, 문화 활동, 여행 등 다양한 활동을 시도해 보는 것이 좋습니다. 가족이나 친구와 함께 시간을 보내는 것도 의미 있는 여가 활동입니다.',
      score: '81/100',
      notes: '여가의 중요성을 잘 설명했습니다.'
    },
    {
      id: '11',
      year: '2021',
      level: 'TOPIK II',
      topic: '자원봉사 활동의 의미와 사회적 역할',
      essayText: '자원봉사는 개인과 사회 모두에게 유익한 활동입니다. 도움이 필요한 곳에 자발적으로 참여하는 것은 의미 있는 일입니다.\n\n자원봉사는 여러 가치가 있습니다. 사회적 약자를 돕고 공동체 의식을 강화할 수 있습니다. 봉사자 본인도 보람을 느끼고 새로운 경험을 할 수 있습니다.\n\n자원봉사를 활성화하기 위해서는 다양한 봉사 기회를 제공해야 합니다. 학교에서는 봉사 활동 교육을 강화하고, 기업은 직원들의 봉사 활동을 지원해야 합니다. 봉사 활동에 대한 인정과 보상 체계도 필요합니다.',
      score: '83/100',
      notes: '사회적 의미를 잘 포착했습니다.'
    },
    {
      id: '12',
      year: '2020',
      level: 'TOPIK II',
      topic: '기후 변화 대응을 위한 개인의 역할',
      essayText: '기후 변화는 전 세계가 직면한 심각한 문제입니다. 이 문제를 해결하기 위해서는 정부와 기업뿐만 아니라 개인의 노력도 필요합니다.\n\n개인이 할 수 있는 일은 많습니다. 에너지 절약을 실천하고 대중교통을 이용해야 합니다. 음식물 쓰레기를 줄이고 재활용을 생활화하는 것도 중요합니다.\n\n작은 실천이 모이면 큰 변화를 만들 수 있습니다. 일회용품 사용을 줄이고 친환경 제품을 선택해야 합니다. 주변 사람들에게도 환경 보호의 중요성을 알려 함께 실천해야 합니다.',
      score: '87/100',
      notes: '개인의 실천 방안을 구체적으로 제시했습니다.'
    },
    {
      id: '13',
      year: '2020',
      level: 'TOPIK II',
      topic: '다문화 사회의 도전과 기회',
      essayText: '한국 사회는 빠르게 다문화 사회로 변화하고 있습니다. 외국인 근로자와 결혼 이민자가 증가하면서 문화적 다양성이 커지고 있습니다.\n\n다문화 사회는 도전과 기회를 동시에 제공합니다. 문화적 충돌과 차별이 발생할 수 있지만, 다양한 문화를 경험하고 배울 수 있는 기회도 있습니다.\n\n성공적인 다문화 사회를 만들기 위해서는 상호 존중과 이해가 필요합니다. 다문화 교육을 강화하고 차별을 금지하는 법규를 마련해야 합니다. 또한 다문화 가정을 지원하는 프로그램을 확대해야 합니다.',
      score: '89/100',
      notes: '균형 잡힌 시각으로 주제를 다루었습니다.'
    },
    {
      id: '14',
      year: '2020',
      level: 'TOPIK II',
      topic: '소셜 미디어가 인간관계에 미치는 영향',
      essayText: '소셜 미디어는 현대인의 소통 방식을 크게 변화시켰습니다. 페이스북, 인스타그램, 트위터 등을 통해 쉽게 연결될 수 있습니다.\n\n소셜 미디어는 긍정적인 면과 부정적인 면이 있습니다. 멀리 있는 사람과도 쉽게 소통할 수 있지만, 대면 소통이 줄어들 수 있습니다. 다양한 정보를 얻을 수 있지만 가짜 뉴스도 많습니다.\n\n건강한 소셜 미디어 사용을 위해서는 적절한 균형이 필요합니다. 온라인과 오프라인 소통을 조화롭게 해야 합니다. 또한 개인 정보 보호에 주의하고 비판적으로 정보를 판단해야 합니다.',
      score: '84/100',
      notes: '현실적인 문제와 해결책을 제시했습니다.'
    },
    {
      id: '15',
      year: '2020',
      level: 'TOPIK II',
      topic: '일과 가정의 균형',
      essayText: '현대 사회에서 일과 가정의 균형을 맞추는 것은 많은 사람들의 과제입니다. 특히 맞벌이 부부에게는 더욱 어려운 문제입니다.\n\n일과 가정의 균형이 깨지면 여러 문제가 발생합니다. 가족과의 시간이 부족해지고 관계가 소원해질 수 있습니다. 또한 과로로 인한 건강 문제도 생길 수 있습니다.\n\n균형을 맞추기 위해서는 개인의 노력과 함께 사회적 지원이 필요합니다. 유연 근무제를 도입하고 육아 휴직을 보장해야 합니다. 기업은 직원들의 삶의 질을 중요하게 생각해야 합니다.',
      score: '85/100',
      notes: '개인적, 사회적 차원의 해결책을 제시했습니다.'
    },
    {
      id: '16',
      year: '2019',
      level: 'TOPIK II',
      topic: '청년 실업 문제와 해결 방안',
      essayText: '청년 실업은 한국 사회의 심각한 문제입니다. 많은 대학 졸업자들이 취업에 어려움을 겪고 있습니다.\n\n청년 실업의 원인은 다양합니다. 일자리는 부족한데 구직자는 많습니다. 또한 기업이 원하는 능력과 구직자의 능력 사이에 차이가 있습니다.\n\n이 문제를 해결하기 위해서는 여러 노력이 필요합니다. 정부는 청년 일자리를 창출하고 직업 교육을 강화해야 합니다. 기업은 청년 채용을 늘려야 합니다. 청년들도 다양한 분야에 관심을 가지고 실무 능력을 키워야 합니다.',
      score: '82/100',
      notes: '문제의 원인과 해결책을 논리적으로 제시했습니다.'
    },
    {
      id: '17',
      year: '2019',
      level: 'TOPIK II',
      topic: '고령화 사회의 문제와 대응',
      essayText: '한국은 빠르게 고령화 사회로 진입하고 있습니다. 평균 수명이 길어지고 출산율이 낮아지면서 노인 인구가 증가하고 있습니다.\n\n고령화는 여러 사회 문제를 야기합니다. 노인 부양 부담이 커지고 의료비가 증가합니다. 또한 노동력이 부족해질 수 있습니다.\n\n이에 대응하기 위해서는 종합적인 정책이 필요합니다. 연금 제도를 개선하고 노인 일자리를 창출해야 합니다. 의료 서비스를 확충하고 노인 돌봄 시스템을 강화해야 합니다. 또한 출산을 장려하는 정책도 병행해야 합니다.',
      score: '88/100',
      notes: '사회 문제를 깊이 있게 다루었습니다.'
    },
    {
      id: '18',
      year: '2019',
      level: 'TOPIK II',
      topic: '인공지능 시대의 교육',
      essayText: '인공지능 기술이 빠르게 발전하면서 미래 사회가 변화하고 있습니다. 이에 따라 교육 방식도 바뀌어야 합니다.\n\n전통적인 암기 위주의 교육으로는 인공지능 시대에 대응할 수 없습니다. 창의력, 문제 해결 능력, 협업 능력 등이 더욱 중요해지고 있습니다.\n\n미래 교육은 이러한 능력을 기르는 데 초점을 맞춰야 합니다. 프로젝트 기반 학습을 도입하고 코딩 교육을 강화해야 합니다. 또한 평생 학습의 중요성을 인식하고 지속적으로 새로운 기술을 배울 수 있는 시스템을 구축해야 합니다.',
      score: '90/100',
      notes: '미래 지향적인 관점에서 교육을 논했습니다.'
    },
    {
      id: '19',
      year: '2019',
      level: 'TOPIK II',
      topic: '한류의 세계적 확산과 문화 교류',
      essayText: 'K-pop, K-drama, K-movie 등 한국 문화가 세계적으로 인기를 얻고 있습니다. 이러한 한류 현상은 한국의 국가 이미지를 높이고 있습니다.\n\n한류는 경제적, 문화적으로 긍정적인 영향을 미칩니다. 관광객이 증가하고 한국 제품의 수출이 늘어납니다. 또한 다른 나라 사람들이 한국 문화를 이해하게 됩니다.\n\n한류를 지속적으로 발전시키기 위해서는 다양한 노력이 필요합니다. 질 높은 콘텐츠를 제작하고 문화 교류 프로그램을 확대해야 합니다. 또한 한국어 교육을 지원하여 더 많은 사람들이 한국 문화를 깊이 있게 이해할 수 있도록 해야 합니다.',
      score: '86/100',
      notes: '한류 현상을 다각도로 분석했습니다.'
    },
    {
      id: '20',
      year: '2018',
      level: 'TOPIK II',
      topic: '도시와 농촌의 균형 발전',
      essayText: '한국은 급속한 도시화를 경험했습니다. 많은 사람들이 일자리와 교육 기회를 찾아 도시로 이동했습니다. 그 결과 농촌 인구가 감소하고 지역 간 불균형이 심화되었습니다.\n\n이러한 불균형은 여러 문제를 야기합니다. 농촌은 고령화되고 활력을 잃었습니다. 반면 도시는 과밀화로 인한 문제를 겪고 있습니다.\n\n균형 발전을 위해서는 농촌에 투자를 확대해야 합니다. 교통과 통신 인프라를 개선하고 의료 및 교육 시설을 확충해야 합니다. 또한 농촌에서도 일할 수 있는 양질의 일자리를 창출해야 합니다. 청년들이 농촌으로 돌아올 수 있는 환경을 만드는 것이 중요합니다.',
      score: '87/100',
      notes: '지역 불균형 문제를 체계적으로 다루었습니다.'
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
    },
    {
      id: '9',
      korean: '작심삼일 (作心三日)',
      meaning: 'A resolution lasts only three days',
      example: '운동을 시작했지만 작심삼일로 끝났어요.',
      category: 'Perseverance'
    },
    {
      id: '10',
      korean: '고생 끝에 낙이 온다',
      meaning: 'After hardship comes happiness',
      example: '힘든 시험 기간이 끝나고 고생 끝에 낙이 왔어요.',
      category: 'Motivation'
    },
    {
      id: '11',
      korean: '말이 씨가 된다',
      meaning: 'Words become seeds - what you say can come true',
      example: '좋은 말만 하세요. 말이 씨가 되니까요.',
      category: 'Wisdom'
    },
    {
      id: '12',
      korean: '하늘이 무너져도 솟아날 구멍이 있다',
      meaning: 'Even if the sky falls, there is a hole to escape through',
      example: '걱정하지 마세요. 하늘이 무너져도 솟아날 구멍이 있어요.',
      category: 'Hope'
    },
    {
      id: '13',
      korean: '가는 말이 고와야 오는 말이 곱다',
      meaning: 'If your words are kind, kind words will return',
      example: '가는 말이 고와야 오는 말이 곱다고 친절하게 대하세요.',
      category: 'Respect'
    },
    {
      id: '14',
      korean: '급할수록 돌아가라',
      meaning: 'The more urgent, take the long way around',
      example: '급할수록 돌아가라는 말처럼 천천히 준비하세요.',
      category: 'Patience'
    },
    {
      id: '15',
      korean: '낮말은 새가 듣고 밤말은 쥐가 듣는다',
      meaning: 'Birds hear day words, mice hear night words - be careful what you say',
      example: '비밀 얘기는 조심하세요. 낮말은 새가 듣고 밤말은 쥐가 듣는다니까요.',
      category: 'Caution'
    },
    {
      id: '16',
      korean: '원숭이도 나무에서 떨어진다',
      meaning: 'Even monkeys fall from trees - anyone can make mistakes',
      example: '실수했어요? 원숭이도 나무에서 떨어져요.',
      category: 'Comfort'
    },
    {
      id: '17',
      korean: '누워서 침 뱉기',
      meaning: 'Spitting while lying down - harming yourself',
      example: '그런 행동은 누워서 침 뱉기예요.',
      category: 'Warning'
    },
    {
      id: '18',
      korean: '쇠뿔도 단김에 빼라',
      meaning: 'Strike while the iron is hot',
      example: '기회가 왔으니 쇠뿔도 단김에 빼라고 지금 시작하세요.',
      category: 'Action'
    },
    {
      id: '19',
      korean: '소 잃고 외양간 고친다',
      meaning: 'Closing the barn door after the horse is out',
      example: '이미 늦었어요. 소 잃고 외양간 고치는 격이에요.',
      category: 'Regret'
    },
    {
      id: '20',
      korean: '콩 심은 데 콩 나고 팥 심은 데 팥 난다',
      meaning: 'You reap what you sow',
      example: '열심히 공부하면 좋은 결과가 나와요. 콩 심은 데 콩 나니까요.',
      category: 'Karma'
    },
    {
      id: '21',
      korean: '벼는 익을수록 고개를 숙인다',
      meaning: 'The riper the rice, the lower it bows - be humble',
      example: '성공해도 겸손해야 해요. 벼는 익을수록 고개를 숙이니까요.',
      category: 'Humility'
    },
    {
      id: '22',
      korean: '가재는 게 편이다',
      meaning: 'The crayfish sides with the crab - similar people stick together',
      example: '그들이 친구가 될 줄 알았어요. 가재는 게 편이니까요.',
      category: 'Relationships'
    },
    {
      id: '23',
      korean: '눈에는 눈 이에는 이',
      meaning: 'An eye for an eye, a tooth for a tooth',
      example: '복수하고 싶어요. 눈에는 눈 이에는 이니까요.',
      category: 'Justice'
    },
    {
      id: '24',
      korean: '개구리 올챙이 적 생각 못 한다',
      meaning: 'The frog forgets it was once a tadpole',
      example: '성공한 후 교만해졌어요. 개구리 올챙이 적 생각 못 하네요.',
      category: 'Gratitude'
    },
    {
      id: '25',
      korean: '구슬이 서 말이라도 꿰어야 보배',
      meaning: 'Even three sacks of jewels are worthless unless strung',
      example: '계획만 세우지 말고 실행하세요. 구슬이 서 말이라도 꿰어야 보배예요.',
      category: 'Action'
    },
    {
      id: '26',
      korean: '하늘의 별 따기',
      meaning: 'Picking stars from the sky - impossible task',
      example: '그 목표는 하늘의 별 따기예요.',
      category: 'Difficulty'
    },
    {
      id: '27',
      korean: '열 번 찍어 안 넘어가는 나무 없다',
      meaning: 'No tree won\'t fall after ten chops - persistence pays off',
      example: '계속 노력하세요. 열 번 찍어 안 넘어가는 나무 없어요.',
      category: 'Perseverance'
    },
    {
      id: '28',
      korean: '백지장도 맞들면 낫다',
      meaning: 'Even a sheet of paper is lighter when two people lift it',
      example: '같이 하면 쉬워요. 백지장도 맞들면 낫잖아요.',
      category: 'Cooperation'
    },
    {
      id: '29',
      korean: '고래 싸움에 새우 등 터진다',
      meaning: 'When whales fight, the shrimp\'s back is broken',
      example: '부모님이 싸우니 아이들이 힘들어요. 고래 싸움에 새우 등 터지네요.',
      category: 'Conflict'
    },
    {
      id: '30',
      korean: '꿩 먹고 알 먹고',
      meaning: 'Eating the pheasant and the egg too - having it all',
      example: '돈도 벌고 경험도 쌓으니 꿩 먹고 알 먹고예요.',
      category: 'Benefit'
    },
    {
      id: '31',
      korean: '돌다리도 두들겨 보고 건너라',
      meaning: 'Tap even a stone bridge before crossing - be cautious',
      example: '계약서를 꼼꼼히 읽으세요. 돌다리도 두들겨 보고 건너야죠.',
      category: 'Caution'
    },
    {
      id: '32',
      korean: '믿는 도끼에 발등 찍힌다',
      meaning: 'The axe you trust chops your foot - betrayal',
      example: '친구가 배신했어요. 믿는 도끼에 발등 찍혔네요.',
      category: 'Betrayal'
    },
    {
      id: '33',
      korean: '천 리 길도 한 걸음부터',
      meaning: 'A journey of a thousand miles begins with a single step',
      example: '지금 시작하세요. 천 리 길도 한 걸음부터예요.',
      category: 'Beginning'
    },
    {
      id: '34',
      korean: '윗물이 맑아야 아랫물이 맑다',
      meaning: 'When upstream water is clear, downstream water is clear',
      example: '리더가 모범을 보여야 해요. 윗물이 맑아야 아랫물이 맑아요.',
      category: 'Leadership'
    },
    {
      id: '35',
      korean: '세 살 버릇 여든까지 간다',
      meaning: 'Habits formed at three last until eighty',
      example: '어릴 때부터 좋은 습관을 들이세요. 세 살 버릇 여든까지 가니까요.',
      category: 'Habit'
    },
    {
      id: '36',
      korean: '낫 놓고 기역 자도 모른다',
      meaning: 'Doesn\'t know \'ㄱ\' even with a sickle in front - completely ignorant',
      example: '그는 컴퓨터를 전혀 못 다뤄요. 낫 놓고 기역 자도 몰라요.',
      category: 'Ignorance'
    },
    {
      id: '37',
      korean: '발 없는 말이 천 리 간다',
      meaning: 'Words without feet travel a thousand miles',
      example: '험담은 조심하세요. 발 없는 말이 천 리 가요.',
      category: 'Gossip'
    },
    {
      id: '38',
      korean: '떡 줄 사람은 생각도 안 하는데 김칫국부터 마신다',
      meaning: 'Drinking kimchi soup before being offered rice cake - getting ahead of oneself',
      example: '합격도 안 했는데 벌써 계획을 세워요? 김칫국부터 마시네요.',
      category: 'Premature'
    },
    {
      id: '39',
      korean: '식은 죽 먹기',
      meaning: 'Eating cold porridge - very easy',
      example: '이 문제는 식은 죽 먹기예요.',
      category: 'Easy'
    },
    {
      id: '40',
      korean: '산 넘어 산',
      meaning: 'Mountain after mountain - endless difficulties',
      example: '문제가 계속 생겨요. 정말 산 넘어 산이네요.',
      category: 'Difficulty'
    },
    {
      id: '41',
      korean: '눈에 넣어도 아프지 않다',
      meaning: 'Wouldn\'t hurt even in one\'s eye - extremely precious',
      example: '손자가 너무 예뻐서 눈에 넣어도 아프지 않아요.',
      category: 'Love'
    },
    {
      id: '42',
      korean: '손이 크다',
      meaning: 'Big hands - generous',
      example: '할머니는 손이 커서 항상 음식을 많이 주세요.',
      category: 'Generosity'
    },
    {
      id: '43',
      korean: '발이 넓다',
      meaning: 'Wide feet - well-connected',
      example: '그 사람은 발이 넓어서 모르는 사람이 없어요.',
      category: 'Network'
    },
    {
      id: '44',
      korean: '눈이 높다',
      meaning: 'High eyes - having high standards',
      example: '취직이 안 되는 이유는 눈이 너무 높아서예요.',
      category: 'Standards'
    },
    {
      id: '45',
      korean: '귀가 얇다',
      meaning: 'Thin ears - easily influenced',
      example: '그는 귀가 얇아서 쉽게 속아요.',
      category: 'Gullible'
    },
    {
      id: '46',
      korean: '입이 무겁다',
      meaning: 'Heavy mouth - good at keeping secrets',
      example: '비밀을 말해도 돼요. 그는 입이 무거워요.',
      category: 'Trust'
    },
    {
      id: '47',
      korean: '입이 가볍다',
      meaning: 'Light mouth - can\'t keep secrets',
      example: '그에게는 비밀을 말하지 마세요. 입이 가벼워요.',
      category: 'Unreliable'
    },
    {
      id: '48',
      korean: '손이 빠르다',
      meaning: 'Fast hands - quick worker',
      example: '그녀는 손이 빨라서 일을 금방 끝내요.',
      category: 'Efficiency'
    },
    {
      id: '49',
      korean: '발이 빠르다',
      meaning: 'Fast feet - quick to act',
      example: '소식을 듣자마자 발이 빠르게 현장에 갔어요.',
      category: 'Speed'
    },
    {
      id: '50',
      korean: '눈치가 빠르다',
      meaning: 'Quick sense - perceptive',
      example: '그는 눈치가 빨라서 상황을 빨리 파악해요.',
      category: 'Perceptive'
    },
    {
      id: '51',
      korean: '손에 땀을 쥐다',
      meaning: 'Sweat in one\'s hands - very tense or exciting',
      example: '영화가 너무 긴장돼서 손에 땀을 쥐었어요.',
      category: 'Tension'
    },
    {
      id: '52',
      korean: '귀에 못이 박이다',
      meaning: 'Nails in one\'s ears - heard something too many times',
      example: '그 얘기는 귀에 못이 박이게 들었어요.',
      category: 'Repetition'
    },
    {
      id: '53',
      korean: '피도 눈물도 없다',
      meaning: 'Neither blood nor tears - heartless',
      example: '그는 피도 눈물도 없이 해고했어요.',
      category: 'Heartless'
    },
    {
      id: '54',
      korean: '낯이 두껍다',
      meaning: 'Thick face - shameless',
      example: '그렇게 실수하고도 낯이 두껍게 다시 왔어요.',
      category: 'Shameless'
    },
    {
      id: '55',
      korean: '간이 크다',
      meaning: 'Big liver - bold or audacious',
      example: '그런 위험한 일을 하다니 간이 크네요.',
      category: 'Boldness'
    },
    {
      id: '56',
      korean: '간이 콩알만 하다',
      meaning: 'Liver the size of a bean - cowardly',
      example: '그는 간이 콩알만 해서 무서운 영화를 못 봐요.',
      category: 'Cowardly'
    },
    {
      id: '57',
      korean: '가슴이 뭉클하다',
      meaning: 'Heart feels lumpy - moved emotionally',
      example: '감동적인 장면에 가슴이 뭉클했어요.',
      category: 'Emotion'
    },
    {
      id: '58',
      korean: '가슴에 손을 얹다',
      meaning: 'Put hand on heart - reflect honestly',
      example: '가슴에 손을 얹고 생각해 보세요.',
      category: 'Reflection'
    },
    {
      id: '59',
      korean: '머리를 굴리다',
      meaning: 'Roll one\'s head - think hard',
      example: '해결책을 찾으려고 머리를 굴렸어요.',
      category: 'Thinking'
    },
    {
      id: '60',
      korean: '발을 씻다',
      meaning: 'Wash one\'s feet - quit something bad',
      example: '나쁜 습관을 버리고 발을 씻었어요.',
      category: 'Reform'
    },
    {
      id: '61',
      korean: '손을 떼다',
      meaning: 'Remove hands - stop involvement',
      example: '그 사업에서 손을 뗐어요.',
      category: 'Withdrawal'
    },
    {
      id: '62',
      korean: '발을 뻗고 자다',
      meaning: 'Sleep with legs stretched - sleep soundly',
      example: '일을 끝내고 발을 뻗고 잤어요.',
      category: 'Relief'
    },
    {
      id: '63',
      korean: '눈을 붙이다',
      meaning: 'Stick eyes - take a nap',
      example: '잠깐 눈을 붙이고 올게요.',
      category: 'Rest'
    },
    {
      id: '64',
      korean: '귀를 기울이다',
      meaning: 'Tilt ears - listen carefully',
      example: '그의 말에 귀를 기울였어요.',
      category: 'Attention'
    },
    {
      id: '65',
      korean: '입을 다물다',
      meaning: 'Close mouth - keep quiet',
      example: '비밀이니까 입을 다물어요.',
      category: 'Silence'
    },
    {
      id: '66',
      korean: '손을 벌리다',
      meaning: 'Open hands - beg or ask for help',
      example: '어쩔 수 없이 부모님께 손을 벌렸어요.',
      category: 'Request'
    },
    {
      id: '67',
      korean: '발을 동동 구르다',
      meaning: 'Stamp feet - very anxious or frustrated',
      example: '결과를 기다리며 발을 동동 굴렀어요.',
      category: 'Anxiety'
    },
    {
      id: '68',
      korean: '눈을 감아 주다',
      meaning: 'Close eyes for - overlook',
      example: '이번만 눈을 감아 줄게요.',
      category: 'Forgiveness'
    },
    {
      id: '69',
      korean: '손이 닿다',
      meaning: 'Hands reach - have influence or access',
      example: '그곳까지는 손이 닿지 않아요.',
      category: 'Reach'
    },
    {
      id: '70',
      korean: '발이 묶이다',
      meaning: 'Feet are tied - unable to move freely',
      example: '일 때문에 발이 묶여서 여행을 못 가요.',
      category: 'Restriction'
    },
    {
      id: '71',
      korean: '눈에 불을 켜다',
      meaning: 'Light fire in eyes - look desperately',
      example: '물건을 찾으려고 눈에 불을 켰어요.',
      category: 'Desperate'
    },
    {
      id: '72',
      korean: '귀가 따갑다',
      meaning: 'Ears hurt - hear nagging repeatedly',
      example: '공부하라는 말에 귀가 따가워요.',
      category: 'Nagging'
    },
    {
      id: '73',
      korean: '입에 침이 마르다',
      meaning: 'Mouth dries - praise endlessly',
      example: '아들 자랑에 입에 침이 마르도록 했어요.',
      category: 'Praise'
    },
    {
      id: '74',
      korean: '손에 잡히지 않다',
      meaning: 'Can\'t catch in hands - unable to focus',
      example: '걱정돼서 일이 손에 잡히지 않아요.',
      category: 'Distraction'
    },
    {
      id: '75',
      korean: '발을 들이다',
      meaning: 'Put foot in - get involved',
      example: '그 일에 발을 들였다가 후회했어요.',
      category: 'Involvement'
    },
    {
      id: '76',
      korean: '눈에 차다',
      meaning: 'Fill one\'s eyes - satisfactory',
      example: '마음에 드는 집이 없어요. 눈에 차는 게 없네요.',
      category: 'Satisfaction'
    },
    {
      id: '77',
      korean: '귀가 솔깃하다',
      meaning: 'Ears perk up - interested',
      example: '좋은 조건에 귀가 솔깃했어요.',
      category: 'Interest'
    },
    {
      id: '78',
      korean: '입만 살다',
      meaning: 'Only mouth is alive - all talk, no action',
      example: '그는 항상 입만 살아요.',
      category: 'Empty talk'
    },
    {
      id: '79',
      korean: '손이 모자라다',
      meaning: 'Hands are lacking - not enough workers',
      example: '일이 많아서 손이 모자라요.',
      category: 'Shortage'
    },
    {
      id: '80',
      korean: '발이 넓어지다',
      meaning: 'Feet widen - network expands',
      example: '사회생활을 하면서 발이 넓어졌어요.',
      category: 'Expansion'
    },
    {
      id: '81',
      korean: '눈앞이 캄캄하다',
      meaning: 'Dark before eyes - hopeless situation',
      example: '시험에 떨어져서 눈앞이 캄캄해요.',
      category: 'Despair'
    },
    {
      id: '82',
      korean: '귀가 번쩍 뜨이다',
      meaning: 'Ears open wide - suddenly alert',
      example: '내 이름을 부르는 소리에 귀가 번쩍 뜨였어요.',
      category: 'Alert'
    },
    {
      id: '83',
      korean: '입이 짧다',
      meaning: 'Short mouth - picky eater',
      example: '아이가 입이 짧아서 편식을 해요.',
      category: 'Picky'
    },
    {
      id: '84',
      korean: '손을 보다',
      meaning: 'Look at hands - fix or repair',
      example: '고장 난 컴퓨터를 손을 봤어요.',
      category: 'Repair'
    },
    {
      id: '85',
      korean: '발등에 불이 떨어지다',
      meaning: 'Fire falls on instep - urgent situation',
      example: '마감일이 내일이라 발등에 불이 떨어졌어요.',
      category: 'Urgency'
    },
    {
      id: '86',
      korean: '눈물을 머금다',
      meaning: 'Hold tears - sorrowfully',
      example: '눈물을 머금고 작별을 고했어요.',
      category: 'Sadness'
    },
    {
      id: '87',
      korean: '귀를 의심하다',
      meaning: 'Doubt ears - can\'t believe what one hears',
      example: '놀라운 소식에 귀를 의심했어요.',
      category: 'Disbelief'
    },
    {
      id: '88',
      korean: '입을 모으다',
      meaning: 'Put mouths together - unanimous',
      example: '모두가 입을 모아 칭찬했어요.',
      category: 'Agreement'
    },
    {
      id: '89',
      korean: '손가락질하다',
      meaning: 'Point fingers - criticize',
      example: '나쁜 행동에 사람들이 손가락질했어요.',
      category: 'Criticism'
    },
    {
      id: '90',
      korean: '발목을 잡히다',
      meaning: 'Ankle is caught - held back',
      example: '과거 실수가 발목을 잡혔어요.',
      category: 'Hindrance'
    },
    {
      id: '91',
      korean: '눈이 뒤집히다',
      meaning: 'Eyes flip - go crazy with anger',
      example: '화가 나서 눈이 뒤집혔어요.',
      category: 'Anger'
    },
    {
      id: '92',
      korean: '귀를 막다',
      meaning: 'Cover ears - refuse to listen',
      example: '충고를 듣기 싫어서 귀를 막았어요.',
      category: 'Refusal'
    },
    {
      id: '93',
      korean: '입이 근질거리다',
      meaning: 'Mouth itches - want to say something',
      example: '비밀을 알고 있으니 입이 근질거려요.',
      category: 'Temptation'
    },
    {
      id: '94',
      korean: '손이 가다',
      meaning: 'Hands go - require effort',
      example: '요리는 손이 많이 가요.',
      category: 'Effort'
    },
    {
      id: '95',
      korean: '발을 끊다',
      meaning: 'Cut feet - stop visiting',
      example: '그 가게에 발을 끊었어요.',
      category: 'Boycott'
    },
    {
      id: '96',
      korean: '눈에 선하다',
      meaning: 'Clear in eyes - vividly remembered',
      example: '어릴 적 추억이 눈에 선해요.',
      category: 'Memory'
    },
    {
      id: '97',
      korean: '귀에 익다',
      meaning: 'Familiar to ears - often heard',
      example: '그 노래는 귀에 익어요.',
      category: 'Familiar'
    },
    {
      id: '98',
      korean: '입맛이 없다',
      meaning: 'No appetite - don\'t feel like eating',
      example: '걱정돼서 입맛이 없어요.',
      category: 'Worry'
    },
    {
      id: '99',
      korean: '손에 땀이 나다',
      meaning: 'Sweat on hands - nervous',
      example: '발표 전에 손에 땀이 났어요.',
      category: 'Nervousness'
    },
    {
      id: '100',
      korean: '발 디딜 틈이 없다',
      meaning: 'No room to step - very crowded',
      example: '사람이 많아서 발 디딜 틈이 없었어요.',
      category: 'Crowded'
    },
    {
      id: '101',
      korean: '눈물 없이 못 보다',
      meaning: 'Can\'t watch without tears - very moving',
      example: '그 영화는 눈물 없이 못 봐요.',
      category: 'Moving'
    },
    {
      id: '102',
      korean: '귀가 먹다',
      meaning: 'Ears eat - become deaf',
      example: '나이가 들어서 귀가 먹었어요.',
      category: 'Aging'
    },
    {
      id: '103',
      korean: '입이 열 개라도 할 말이 없다',
      meaning: 'Nothing to say even with ten mouths - indefensible',
      example: '잘못이 분명해서 입이 열 개라도 할 말이 없어요.',
      category: 'Guilt'
    },
    {
      id: '104',
      korean: '손이 크고 발이 크다',
      meaning: 'Big hands and feet - generous and well-connected',
      example: '그 사람은 손이 크고 발이 커서 사람들이 좋아해요.',
      category: 'Popular'
    },
    {
      id: '105',
      korean: '발로 뛰다',
      meaning: 'Run with feet - work hard physically',
      example: '정보를 모으려고 발로 뛰었어요.',
      category: 'Hard work'
    },
    {
      id: '106',
      korean: '눈 밖에 나다',
      meaning: 'Outside of eyes - fall from favor',
      example: '실수를 해서 상사의 눈 밖에 났어요.',
      category: 'Disfavor'
    },
    {
      id: '107',
      korean: '귀가 얇아지다',
      meaning: 'Ears become thin - easily swayed',
      example: '나이가 들면서 귀가 얇아졌어요.',
      category: 'Influence'
    },
    {
      id: '108',
      korean: '입이 무섭다',
      meaning: 'Scary mouth - harsh words',
      example: '그는 입이 무서워서 조심해야 해요.',
      category: 'Harsh'
    }
  ]);

  // Handler functions
  const handleAddQuestion = () => {
    if (!newQuestion.question || !newQuestion.answer) {
      toast.error("Please fill in all required fields");
      return;
    }
    const question: Question = {
      id: Date.now().toString(),
      year: newQuestion.year || '',
      level: newQuestion.level || '',
      type: newQuestion.type || '',
      question: newQuestion.question,
      answer: newQuestion.answer,
      explanation: newQuestion.explanation || ''
    };
    setQuestions([...questions, question]);
    setNewQuestion({});
    setOpenQuestionDialog(false);
    toast.success("Question added successfully");
  };

  const handleAddEssay = () => {
    if (!newEssay.topic || !newEssay.essayText) {
      toast.error("Please fill in all required fields");
      return;
    }
    const essay: Essay = {
      id: Date.now().toString(),
      year: newEssay.year || '',
      level: newEssay.level || '',
      topic: newEssay.topic,
      essayText: newEssay.essayText,
      score: newEssay.score || '',
      notes: newEssay.notes || ''
    };
    setEssays([...essays, essay]);
    setNewEssay({});
    setOpenEssayDialog(false);
    toast.success("Essay added successfully");
  };

  const handleAddTopic = () => {
    if (!newTopic.topic) {
      toast.error("Please fill in the topic");
      return;
    }
    const topic: EssayTopic = {
      id: Date.now().toString(),
      year: newTopic.year || '',
      level: newTopic.level || '',
      topic: newTopic.topic,
      keywords: newTopic.keywords || []
    };
    setTopics([...topics, topic]);
    setNewTopic({ keywords: [] });
    setKeywordInput('');
    setOpenTopicDialog(false);
    toast.success("Topic added successfully");
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && newTopic.keywords) {
      setNewTopic({
        ...newTopic,
        keywords: [...newTopic.keywords, keywordInput.trim()]
      });
      setKeywordInput('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    if (newTopic.keywords) {
      setNewTopic({
        ...newTopic,
        keywords: newTopic.keywords.filter((_, i) => i !== index)
      });
    }
  };

  const handleAddIdiom = () => {
    if (!newIdiom.korean || !newIdiom.meaning) {
      toast.error("Please fill in all required fields");
      return;
    }
    const idiom: Idiom = {
      id: Date.now().toString(),
      korean: newIdiom.korean,
      meaning: newIdiom.meaning,
      example: newIdiom.example || '',
      category: newIdiom.category || ''
    };
    setIdioms([...idioms, idiom]);
    setNewIdiom({});
    setOpenIdiomDialog(false);
    toast.success("Idiom added successfully");
  };

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
              <Dialog open={openQuestionDialog} onOpenChange={setOpenQuestionDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Question
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add New Question</DialogTitle>
                    <DialogDescription>Add a sample TOPIK question</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="q-year">Year</Label>
                        <Input
                          id="q-year"
                          value={newQuestion.year || ''}
                          onChange={(e) => setNewQuestion({ ...newQuestion, year: e.target.value })}
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <Label htmlFor="q-level">Level</Label>
                        <Input
                          id="q-level"
                          value={newQuestion.level || ''}
                          onChange={(e) => setNewQuestion({ ...newQuestion, level: e.target.value })}
                          placeholder="TOPIK II"
                        />
                      </div>
                      <div>
                        <Label htmlFor="q-type">Type</Label>
                        <Input
                          id="q-type"
                          value={newQuestion.type || ''}
                          onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value })}
                          placeholder="Reading"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="q-question">Question *</Label>
                      <Textarea
                        id="q-question"
                        value={newQuestion.question || ''}
                        onChange={(e) => setNewQuestion({ ...newQuestion, question: e.target.value })}
                        placeholder="Enter the question text..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="q-answer">Answer *</Label>
                      <Textarea
                        id="q-answer"
                        value={newQuestion.answer || ''}
                        onChange={(e) => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                        placeholder="Enter the answer..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="q-explanation">Explanation</Label>
                      <Textarea
                        id="q-explanation"
                        value={newQuestion.explanation || ''}
                        onChange={(e) => setNewQuestion({ ...newQuestion, explanation: e.target.value })}
                        placeholder="Enter explanation (optional)..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenQuestionDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddQuestion}>Add Question</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <Dialog open={openEssayDialog} onOpenChange={setOpenEssayDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Essay
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Essay Sample</DialogTitle>
                    <DialogDescription>Add a sample essay from past TOPIK exams</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="e-year">Year</Label>
                        <Input
                          id="e-year"
                          value={newEssay.year || ''}
                          onChange={(e) => setNewEssay({ ...newEssay, year: e.target.value })}
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <Label htmlFor="e-level">Level</Label>
                        <Input
                          id="e-level"
                          value={newEssay.level || ''}
                          onChange={(e) => setNewEssay({ ...newEssay, level: e.target.value })}
                          placeholder="TOPIK II"
                        />
                      </div>
                      <div>
                        <Label htmlFor="e-score">Score</Label>
                        <Input
                          id="e-score"
                          value={newEssay.score || ''}
                          onChange={(e) => setNewEssay({ ...newEssay, score: e.target.value })}
                          placeholder="85/100"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="e-topic">Topic *</Label>
                      <Input
                        id="e-topic"
                        value={newEssay.topic || ''}
                        onChange={(e) => setNewEssay({ ...newEssay, topic: e.target.value })}
                        placeholder="Essay topic..."
                      />
                    </div>
                    <div>
                      <Label htmlFor="e-text">Essay Text *</Label>
                      <Textarea
                        id="e-text"
                        value={newEssay.essayText || ''}
                        onChange={(e) => setNewEssay({ ...newEssay, essayText: e.target.value })}
                        placeholder="Enter the essay content..."
                        rows={8}
                      />
                    </div>
                    <div>
                      <Label htmlFor="e-notes">Notes</Label>
                      <Textarea
                        id="e-notes"
                        value={newEssay.notes || ''}
                        onChange={(e) => setNewEssay({ ...newEssay, notes: e.target.value })}
                        placeholder="Add notes or comments (optional)..."
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenEssayDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddEssay}>Add Essay</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <Dialog open={openTopicDialog} onOpenChange={setOpenTopicDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Topic
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Essay Topic</DialogTitle>
                    <DialogDescription>Add a topic from past TOPIK exams</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="t-year">Year</Label>
                        <Input
                          id="t-year"
                          value={newTopic.year || ''}
                          onChange={(e) => setNewTopic({ ...newTopic, year: e.target.value })}
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <Label htmlFor="t-level">Level</Label>
                        <Input
                          id="t-level"
                          value={newTopic.level || ''}
                          onChange={(e) => setNewTopic({ ...newTopic, level: e.target.value })}
                          placeholder="TOPIK II"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="t-topic">Topic *</Label>
                      <Textarea
                        id="t-topic"
                        value={newTopic.topic || ''}
                        onChange={(e) => setNewTopic({ ...newTopic, topic: e.target.value })}
                        placeholder="Essay topic..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="t-keywords">Keywords</Label>
                      <div className="flex gap-2">
                        <Input
                          id="t-keywords"
                          value={keywordInput}
                          onChange={(e) => setKeywordInput(e.target.value)}
                          placeholder="Add a keyword..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyword();
                            }
                          }}
                        />
                        <Button type="button" onClick={handleAddKeyword} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      {newTopic.keywords && newTopic.keywords.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {newTopic.keywords.map((kw, idx) => (
                            <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveKeyword(idx)}>
                              {kw} ×
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenTopicDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddTopic}>Add Topic</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
              <Dialog open={openIdiomDialog} onOpenChange={setOpenIdiomDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Idiom
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Korean Idiom</DialogTitle>
                    <DialogDescription>Add a Korean idiom or saying</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="i-korean">Korean Idiom *</Label>
                      <Input
                        id="i-korean"
                        value={newIdiom.korean || ''}
                        onChange={(e) => setNewIdiom({ ...newIdiom, korean: e.target.value })}
                        placeholder="금상첨화 (錦上添花)"
                      />
                    </div>
                    <div>
                      <Label htmlFor="i-meaning">Meaning *</Label>
                      <Textarea
                        id="i-meaning"
                        value={newIdiom.meaning || ''}
                        onChange={(e) => setNewIdiom({ ...newIdiom, meaning: e.target.value })}
                        placeholder="English meaning..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="i-example">Example Sentence</Label>
                      <Textarea
                        id="i-example"
                        value={newIdiom.example || ''}
                        onChange={(e) => setNewIdiom({ ...newIdiom, example: e.target.value })}
                        placeholder="Example usage in Korean..."
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label htmlFor="i-category">Category</Label>
                      <Input
                        id="i-category"
                        value={newIdiom.category || ''}
                        onChange={(e) => setNewIdiom({ ...newIdiom, category: e.target.value })}
                        placeholder="Positive, Wisdom, etc."
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setOpenIdiomDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddIdiom}>Add Idiom</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
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
