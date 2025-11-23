import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ChapterCard from '@/components/chapters/ChapterCard';
import Navbar from '@/components/layout/Navbar';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ChapterBackupRestore from '@/components/chapters/ChapterBackupRestore';
import { supabase } from '@/integrations/supabase/client';
import { useEffect as useAuthEffect, useState as useAuthState } from 'react';
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
  difficulty?: number;
  topikLevel?: string;
  tags?: string[];
  createdAt?: string;
  priority?: number;
}
const LOCAL_STORAGE_KEY = 'lingualearn_chapters';

// Initialize Korean vocabulary for preset chapters
const initializeKoreanVocabulary = (chapters: Chapter[]) => {
  const koreanVocabulary = {
    '1': { // Basic Greetings
      id: '1',
      title: '기본 인사말 (Basic Greetings)',
      words: [
        { id: crypto.randomUUID(), word: '안녕하세요', definition: 'Hello (formal)', phonetic: 'annyeonghaseyo', example: '안녕하세요! 만나서 반갑습니다.', notes: 'Standard greeting', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['greeting', 'basic'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '안녕', definition: 'Hi / Bye (casual)', phonetic: 'annyeong', example: '안녕! 잘 지냈어?', notes: 'Used with friends', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['greeting', 'casual'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '감사합니다', definition: 'Thank you (formal)', phonetic: 'gamsahamnida', example: '도와주셔서 감사합니다.', notes: 'Polite expression', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['thanks', 'formal'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '고마워요', definition: 'Thank you (casual)', phonetic: 'gomawoyo', example: '정말 고마워요!', notes: 'Less formal', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['thanks', 'casual'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '죄송합니다', definition: 'I\'m sorry (formal)', phonetic: 'joesonghamnida', example: '늦어서 죄송합니다.', notes: 'Formal apology', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['apology', 'formal'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '미안해요', definition: 'Sorry (casual)', phonetic: 'mianhaeyo', example: '미안해요, 실수였어요.', notes: 'Informal apology', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['apology', 'casual'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '안녕히 가세요', definition: 'Goodbye (to person leaving)', phonetic: 'annyeonghi gaseyo', example: '안녕히 가세요. 조심히 가세요!', notes: 'When someone is leaving', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['goodbye', 'formal'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '안녕히 계세요', definition: 'Goodbye (when you leave)', phonetic: 'annyeonghi gyeseyo', example: '안녕히 계세요. 내일 봐요!', notes: 'When you are leaving', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['goodbye', 'formal'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '반갑습니다', definition: 'Nice to meet you', phonetic: 'bangapseumnida', example: '처음 뵙겠습니다. 반갑습니다!', notes: 'First meeting', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['greeting', 'formal'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '잘 지냈어요?', definition: 'How have you been?', phonetic: 'jal jinaesseoyo', example: '오랜만이에요! 잘 지냈어요?', notes: 'Greeting question', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['greeting', 'question'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '네', definition: 'Yes', phonetic: 'ne', example: '네, 맞아요.', notes: 'Affirmative', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['basic', 'response'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '아니요', definition: 'No', phonetic: 'aniyo', example: '아니요, 괜찮아요.', notes: 'Negative', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['basic', 'response'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '괜찮아요', definition: 'It\'s okay / I\'m fine', phonetic: 'gwaenchanayo', example: '괜찮아요, 걱정하지 마세요.', notes: 'Reassurance', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['response', 'reassurance'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '잘 부탁드립니다', definition: 'Please treat me well', phonetic: 'jal butakdeurimnida', example: '앞으로 잘 부탁드립니다!', notes: 'Building relationships', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['formal', 'relationship'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '실례합니다', definition: 'Excuse me', phonetic: 'sillyehamnida', example: '실례합니다. 길 좀 물어볼게요.', notes: 'Polite interruption', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['formal', 'polite'], createdAt: new Date().toISOString(), priority: 4 },
      ]
    },
    '2': { // Daily Conversation
      id: '2',
      title: '일상 대화 (Daily Conversation)',
      words: [
        { id: crypto.randomUUID(), word: '뭐 해요?', definition: 'What are you doing?', phonetic: 'mwo haeyo', example: '지금 뭐 해요?', notes: 'Casual question', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['question', 'daily'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '밥 먹었어요?', definition: 'Did you eat?', phonetic: 'bap meogeosseoyo', example: '점심 밥 먹었어요?', notes: 'Common greeting', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['greeting', 'food'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '배고파요', definition: 'I\'m hungry', phonetic: 'baegopayo', example: '배고파요. 같이 먹을래요?', notes: 'Expressing hunger', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['food', 'feeling'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '피곤해요', definition: 'I\'m tired', phonetic: 'pigonhaeyo', example: '오늘 정말 피곤해요.', notes: 'Expressing fatigue', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['feeling', 'health'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '좋아요', definition: 'Good / I like it', phonetic: 'johayo', example: '이 음식 좋아요!', notes: 'Positive response', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['response', 'positive'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '싫어요', definition: 'I don\'t like it', phonetic: 'sireoyo', example: '매운 음식은 싫어요.', notes: 'Negative preference', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['response', 'negative'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '얼마예요?', definition: 'How much is it?', phonetic: 'eolmayeyo', example: '이거 얼마예요?', notes: 'Shopping', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['shopping', 'question'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '어디 가요?', definition: 'Where are you going?', phonetic: 'eodi gayo', example: '지금 어디 가요?', notes: 'Asking destination', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['question', 'location'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '언제 와요?', definition: 'When are you coming?', phonetic: 'eonje wayo', example: '내일 언제 와요?', notes: 'Asking time', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['question', 'time'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '왜요?', definition: 'Why?', phonetic: 'waeyo', example: '왜요? 무슨 일 있어요?', notes: 'Asking reason', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['question', 'basic'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '이해해요', definition: 'I understand', phonetic: 'ihaehaeyo', example: '네, 이해해요.', notes: 'Comprehension', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['response', 'understanding'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '모르겠어요', definition: 'I don\'t know', phonetic: 'moreugesseoyo', example: '죄송해요, 모르겠어요.', notes: 'Lack of knowledge', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['response', 'negative'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '도와주세요', definition: 'Please help me', phonetic: 'dowajuseyo', example: '도와주세요! 길을 잃었어요.', notes: 'Asking for help', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['help', 'request'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '잠깐만요', definition: 'Wait a moment', phonetic: 'jamkkanmanyo', example: '잠깐만요. 곧 갈게요.', notes: 'Asking to wait', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['request', 'time'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '괜찮아요?', definition: 'Are you okay?', phonetic: 'gwaenchanayo', example: '괜찮아요? 아파 보여요.', notes: 'Showing concern', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['question', 'concern'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '맞아요', definition: 'That\'s right', phonetic: 'majayo', example: '네, 맞아요!', notes: 'Agreement', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['response', 'agreement'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '아니에요', definition: 'That\'s not it', phonetic: 'anieyo', example: '아니에요, 다른 거예요.', notes: 'Disagreement', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['response', 'disagreement'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '정말요?', definition: 'Really?', phonetic: 'jeongmallyo', example: '정말요? 믿을 수 없어요!', notes: 'Surprise', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['response', 'surprise'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '물론이죠', definition: 'Of course', phonetic: 'mullomnijyo', example: '물론이죠! 같이 가요.', notes: 'Confirmation', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['response', 'agreement'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '조금만요', definition: 'Just a little', phonetic: 'jogeummanyo', example: '조금만요. 더 주세요.', notes: 'Quantity', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['quantity', 'request'], createdAt: new Date().toISOString(), priority: 2 },
      ]
    },
    '3': { // Common Sentences
      id: '3',
      title: '자주 쓰는 문장 (Common Sentences)',
      words: [
        { id: crypto.randomUUID(), word: '저는 한국어를 공부해요', definition: 'I study Korean', phonetic: 'jeoneun hangugeoreul gongbuhaeyo', example: '저는 매일 한국어를 공부해요.', notes: 'Present tense', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'study'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '한국어를 할 수 있어요', definition: 'I can speak Korean', phonetic: 'hangugeoreul hal su isseoyo', example: '저는 조금 한국어를 할 수 있어요.', notes: 'Ability', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'ability'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '한국 음식을 좋아해요', definition: 'I like Korean food', phonetic: 'hanguk eumsigeul johahaeyo', example: '저는 한국 음식을 정말 좋아해요.', notes: 'Preference', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'food'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '시간이 없어요', definition: 'I don\'t have time', phonetic: 'sigani eopseoyo', example: '죄송해요, 지금 시간이 없어요.', notes: 'Busy', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['sentence', 'time'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '돈이 필요해요', definition: 'I need money', phonetic: 'doni piryohaeyo', example: '여행하려면 돈이 필요해요.', notes: 'Necessity', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'need'], createdAt: new Date().toISOString(), priority: 2 },
        { id: crypto.randomUUID(), word: '날씨가 좋아요', definition: 'The weather is nice', phonetic: 'nalssiga johayo', example: '오늘 날씨가 정말 좋아요.', notes: 'Weather', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['sentence', 'weather'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '너무 더워요', definition: 'It\'s too hot', phonetic: 'neomu deowoyo', example: '오늘은 너무 더워요.', notes: 'Temperature', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['sentence', 'weather'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '배가 아파요', definition: 'My stomach hurts', phonetic: 'baega apayo', example: '배가 아파요. 병원에 가야 해요.', notes: 'Health', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'health'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '머리가 아파요', definition: 'I have a headache', phonetic: 'meoriga apayo', example: '머리가 아파요. 약이 있어요?', notes: 'Health', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'health'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '길을 잃었어요', definition: 'I\'m lost', phonetic: 'gireul ilheosseoyo', example: '길을 잃었어요. 도와주세요.', notes: 'Emergency', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'emergency'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '지하철역이 어디예요?', definition: 'Where is the subway station?', phonetic: 'jihacheolyeogi eodiyeyo', example: '실례합니다. 지하철역이 어디예요?', notes: 'Direction', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'direction'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '영어를 할 수 있어요?', definition: 'Can you speak English?', phonetic: 'yeongeoreul hal su isseoyo', example: '죄송해요, 영어를 할 수 있어요?', notes: 'Communication', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'language'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '천천히 말해 주세요', definition: 'Please speak slowly', phonetic: 'cheoncheonhi malhae juseyo', example: '천천히 말해 주세요. 잘 못 들었어요.', notes: 'Request', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'request'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '다시 한번 말해 주세요', definition: 'Please say it again', phonetic: 'dasi hanbeon malhae juseyo', example: '다시 한번 말해 주세요.', notes: 'Repetition', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'request'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '사진 찍어도 돼요?', definition: 'Can I take a photo?', phonetic: 'sajin jjigeodo dwaeyo', example: '여기서 사진 찍어도 돼요?', notes: 'Permission', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['sentence', 'permission'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '화장실이 어디예요?', definition: 'Where is the bathroom?', phonetic: 'hwajangsiri eodiyeyo', example: '실례합니다. 화장실이 어디예요?', notes: 'Facility', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['sentence', 'location'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '지금 몇 시예요?', definition: 'What time is it now?', phonetic: 'jigeum myeot siyeyo', example: '실례합니다. 지금 몇 시예요?', notes: 'Time', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['sentence', 'time'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '맛있어요', definition: 'It\'s delicious', phonetic: 'masisseoyo', example: '이 음식 정말 맛있어요!', notes: 'Food', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['sentence', 'food'], createdAt: new Date().toISOString(), priority: 4 },
      ]
    },
    '4': { // Korean Idioms
      id: '4',
      title: 'Korean Idiom (한국 관용어)',
      words: [
        { id: crypto.randomUUID(), word: '금상첨화', definition: 'Adding flowers to brocade - making good even better', phonetic: 'geumsangcheomhwa', example: '좋은 성적에 장학금까지 받다니 금상첨화네요!', notes: 'Chinese character idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'positive'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '일석이조', definition: 'Killing two birds with one stone', phonetic: 'ilseogijo', example: '운동하면서 친구도 만나니 일석이조예요.', notes: 'Efficiency idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'efficiency'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '백문이불여일견', definition: 'Seeing once is better than hearing 100 times', phonetic: 'baengmunibeulyeoilgyeon', example: '한국 문화는 백문이불여일견입니다.', notes: 'Wisdom idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'wisdom'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '호랑이도 제 말 하면 온다', definition: 'Speak of the devil', phonetic: 'horangido je mal hamyeon onda', example: '진수 얘기하고 있었는데 호랑이도 제 말 하면 온다더니!', notes: 'Common saying', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'saying'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '티끌 모아 태산', definition: 'Many drops make a shower', phonetic: 'tikkeul moa taesan', example: '작은 저축이라도 티끌 모아 태산이니까 계속하세요.', notes: 'Saving idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'wisdom'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '우물 안 개구리', definition: 'A frog in a well - limited perspective', phonetic: 'umul an gaeguri', example: '세계를 여행하면 우물 안 개구리에서 벗어날 수 있어요.', notes: 'Perspective idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'perspective'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '눈 코 뜰 새 없다', definition: 'Too busy to even breathe', phonetic: 'nun ko tteul sae eopda', example: '시험 기간이라 눈 코 뜰 새 없이 바빠요.', notes: 'Busyness expression', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'busy'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '새옹지마', definition: 'A blessing in disguise', phonetic: 'saeongjima', example: '시험에 떨어졌지만 새옹지마라고 더 좋은 기회가 올 거예요.', notes: 'Philosophy idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'philosophy'], createdAt: new Date().toISOString(), priority: 2 },
        { id: crypto.randomUUID(), word: '앞길이 창창하다', definition: 'To have a bright future ahead', phonetic: 'apgiri changchanghada', example: '젊으니까 앞길이 창창해요!', notes: 'Positive future', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'positive'], createdAt: new Date().toISOString(), priority: 2 },
        { id: crypto.randomUUID(), word: '손이 크다', definition: 'To be generous with portions/spending', phonetic: 'soni keuda', example: '우리 엄마는 손이 커서 음식을 많이 만드세요.', notes: 'Generosity idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'personality'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '발이 넓다', definition: 'To have a wide network of connections', phonetic: 'bari neolda', example: '그 사람은 발이 넓어서 모르는 사람이 없어요.', notes: 'Network idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'social'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '귀가 얇다', definition: 'To be easily influenced', phonetic: 'gwiga yalda', example: '귀가 얇아서 다른 사람 말을 잘 믿어요.', notes: 'Personality idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'personality'], createdAt: new Date().toISOString(), priority: 2 },
        { id: crypto.randomUUID(), word: '입이 무겁다', definition: 'To be good at keeping secrets', phonetic: 'ibi mugeopda', example: '그 친구는 입이 무거워서 비밀을 잘 지켜요.', notes: 'Trustworthy trait', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'personality'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '가는 날이 장날이다', definition: 'Murphy\'s law - things go wrong at worst time', phonetic: 'ganeun nari jangnalida', example: '휴가 가는 날 비가 오다니 가는 날이 장날이네요.', notes: 'Bad timing idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'timing'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '고생 끝에 낙이 온다', definition: 'After hardship comes happiness', phonetic: 'gosaeng kkeute nagi onda', example: '힘든 시험이 끝났으니 고생 끝에 낙이 오는 거예요.', notes: 'Hope idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'wisdom'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '금강산도 식후경', definition: 'Even Mt. Geumgang looks better after eating', phonetic: 'geumgangsando sikhugyeong', example: '일단 밥부터 먹자. 금강산도 식후경이야.', notes: 'Hunger first idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'food'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '낮말은 새가 듣고 밤말은 쥐가 듣는다', definition: 'Walls have ears', phonetic: 'natmareun saega deutgo bammareun jwiga deutneunda', example: '조심해서 말해. 낮말은 새가 듣고 밤말은 쥐가 듣는다고.', notes: 'Privacy idiom', isBookmarked: false, difficulty: 5, topikLevel: 'TOPIK-2', tags: ['idiom', 'caution'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '뜻이 있는 곳에 길이 있다', definition: 'Where there\'s a will, there\'s a way', phonetic: 'tteusi itneun gose giri itda', example: '포기하지 마. 뜻이 있는 곳에 길이 있어.', notes: 'Motivation idiom', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['idiom', 'motivation'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '로마는 하루아침에 이루어지지 않았다', definition: 'Rome wasn\'t built in a day', phonetic: 'romaneun haruachime irueojiji anatda', example: '천천히 해. 로마는 하루아침에 이루어지지 않았어.', notes: 'Patience idiom', isBookmarked: false, difficulty: 5, topikLevel: 'TOPIK-2', tags: ['idiom', 'patience'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '시작이 반이다', definition: 'Starting is half the battle', phonetic: 'sijagi banida', example: '일단 시작해 봐. 시작이 반이야.', notes: 'Initiative idiom', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['idiom', 'motivation'], createdAt: new Date().toISOString(), priority: 4 },
      ]
    },
    '5': { // Korean Verbs
      id: '5',
      title: 'Korean Verb (한국어 동사)',
      words: [
        { id: crypto.randomUUID(), word: '가다', definition: 'to go', phonetic: 'gada', example: '학교에 가다 (go to school)', notes: 'Basic verb', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'movement'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '오다', definition: 'to come', phonetic: 'oda', example: '친구가 오다 (friend comes)', notes: 'Basic verb', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'movement'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '먹다', definition: 'to eat', phonetic: 'meokda', example: '밥을 먹다 (eat rice/meal)', notes: 'Daily verb', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'food'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '마시다', definition: 'to drink', phonetic: 'masida', example: '물을 마시다 (drink water)', notes: 'Daily verb', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'food'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '하다', definition: 'to do', phonetic: 'hada', example: '공부하다 (to study)', notes: 'Most common verb', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'action'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '보다', definition: 'to see/watch', phonetic: 'boda', example: '영화를 보다 (watch a movie)', notes: 'Perception verb', isBookmarked: false, difficulty: 1, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'perception'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '듣다', definition: 'to listen/hear', phonetic: 'deutda', example: '음악을 듣다 (listen to music)', notes: 'Perception verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'basic', 'perception'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '말하다', definition: 'to speak/say', phonetic: 'malhada', example: '한국어로 말하다 (speak in Korean)', notes: 'Communication verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'communication'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '쓰다', definition: 'to write', phonetic: 'sseuda', example: '편지를 쓰다 (write a letter)', notes: 'Communication verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'communication'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '읽다', definition: 'to read', phonetic: 'ikda', example: '책을 읽다 (read a book)', notes: 'Communication verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'communication'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '살다', definition: 'to live', phonetic: 'salda', example: '서울에 살다 (live in Seoul)', notes: 'State verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'state'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '좋아하다', definition: 'to like', phonetic: 'johahada', example: '한국을 좋아하다 (like Korea)', notes: 'Emotion verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'emotion'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '사랑하다', definition: 'to love', phonetic: 'saranghada', example: '가족을 사랑하다 (love family)', notes: 'Emotion verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'emotion'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '배우다', definition: 'to learn', phonetic: 'baeuda', example: '한국어를 배우다 (learn Korean)', notes: 'Action verb', isBookmarked: false, difficulty: 2, topikLevel: 'TOPIK-1', tags: ['verb', 'education'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '가르치다', definition: 'to teach', phonetic: 'gareuchida', example: '학생들을 가르치다 (teach students)', notes: 'Action verb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-1', tags: ['verb', 'education'], createdAt: new Date().toISOString(), priority: 3 },
      ]
    },
    '6': { // Korean Adverbs
      id: '6',
      title: 'Key Korean Adverb (주요 한국어 부사)',
      words: [
        { id: crypto.randomUUID(), word: '아주', definition: 'very, quite', phonetic: 'aju', example: '아주 좋아요 (very good)', notes: 'Degree adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'degree'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '매우', definition: 'very, extremely', phonetic: 'maeu', example: '매우 중요해요 (very important)', notes: 'Formal degree adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'degree'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '정말', definition: 'really, truly', phonetic: 'jeongmal', example: '정말 맛있어요 (really delicious)', notes: 'Emphasis adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'emphasis'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '너무', definition: 'too, so much', phonetic: 'neomu', example: '너무 비싸요 (too expensive)', notes: 'Excessive adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'degree'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '아마', definition: 'perhaps, probably', phonetic: 'ama', example: '아마 내일 올 거예요 (probably come tomorrow)', notes: 'Probability adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'probability'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '항상', definition: 'always', phonetic: 'hangsang', example: '항상 행복하세요 (always be happy)', notes: 'Frequency adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'frequency'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '자주', definition: 'often, frequently', phonetic: 'jaju', example: '자주 운동해요 (exercise often)', notes: 'Frequency adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'frequency'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '가끔', definition: 'sometimes, occasionally', phonetic: 'gakkeum', example: '가끔 영화를 봐요 (watch movies sometimes)', notes: 'Frequency adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'frequency'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '빨리', definition: 'quickly, fast', phonetic: 'ppalli', example: '빨리 와요 (come quickly)', notes: 'Manner adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'manner'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '천천히', definition: 'slowly', phonetic: 'cheoncheonhi', example: '천천히 말해 주세요 (speak slowly please)', notes: 'Manner adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'manner'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '특히', definition: 'especially, particularly', phonetic: 'teuki', example: '특히 한국 음식을 좋아해요 (especially like Korean food)', notes: 'Emphasis adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'emphasis'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '거의', definition: 'almost, nearly', phonetic: 'geoui', example: '거의 다 했어요 (almost finished)', notes: 'Degree adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'degree'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '절대로', definition: 'absolutely, never', phonetic: 'jeoldaero', example: '절대로 포기하지 마세요 (absolutely never give up)', notes: 'Strong emphasis', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['adverb', 'emphasis'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '반드시', definition: 'certainly, without fail', phonetic: 'bandeusi', example: '반드시 성공할 거예요 (will certainly succeed)', notes: 'Certainty adverb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['adverb', 'certainty'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '결국', definition: 'eventually, in the end', phonetic: 'gyeolguk', example: '결국 진실이 밝혀졌어요 (the truth eventually came out)', notes: 'Outcome adverb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['adverb', 'time'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '이미', definition: 'already', phonetic: 'imi', example: '이미 끝났어요 (it\'s already finished)', notes: 'Completion adverb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'time'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '아직', definition: 'still, yet', phonetic: 'ajik', example: '아직 안 왔어요 (hasn\'t come yet)', notes: 'Ongoing state', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'time'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '곧', definition: 'soon, shortly', phonetic: 'got', example: '곧 시작할 거예요 (will start soon)', notes: 'Near future', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['adverb', 'time'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '전혀', definition: 'not at all, completely not', phonetic: 'jeonhyeo', example: '전혀 몰랐어요 (didn\'t know at all)', notes: 'Complete negation', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['adverb', 'negation'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '충분히', definition: 'sufficiently, enough', phonetic: 'chungbunhi', example: '충분히 준비했어요 (prepared sufficiently)', notes: 'Sufficiency adverb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['adverb', 'degree'], createdAt: new Date().toISOString(), priority: 3 },
      ]
    },
    '7': { // TOPIK-2 Vocabulary
      id: '7',
      title: 'Korean TOPIK-2 Word (토픽2 어휘)',
      words: [
        { id: crypto.randomUUID(), word: '설명하다', definition: 'to explain', phonetic: 'seolmyeonghada', example: '이 문제를 설명해 주세요 (please explain this problem)', notes: 'Academic verb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['verb', 'communication'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '비교하다', definition: 'to compare', phonetic: 'bigyohada', example: '두 제품을 비교하고 있어요 (comparing two products)', notes: 'Analysis verb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['verb', 'analysis'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '준비하다', definition: 'to prepare', phonetic: 'junbihada', example: '시험을 준비하고 있어요 (preparing for the exam)', notes: 'Action verb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['verb', 'action'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '연습하다', definition: 'to practice', phonetic: 'yeonseuphada', example: '매일 한국어를 연습해요 (practice Korean every day)', notes: 'Learning verb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['verb', 'learning'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '경험하다', definition: 'to experience', phonetic: 'gyeongheomhada', example: '다양한 문화를 경험했어요 (experienced diverse cultures)', notes: 'Experience verb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['verb', 'experience'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '발전하다', definition: 'to develop, improve', phonetic: 'baljeonhada', example: '한국어 실력이 발전했어요 (Korean skills improved)', notes: 'Progress verb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['verb', 'progress'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '표현하다', definition: 'to express', phonetic: 'pyohyeonhada', example: '감정을 표현하는 게 어려워요 (expressing emotions is difficult)', notes: 'Communication verb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['verb', 'communication'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '해결하다', definition: 'to solve, resolve', phonetic: 'haegyeolhada', example: '문제를 해결해야 해요 (need to solve the problem)', notes: 'Problem-solving verb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['verb', 'problem-solving'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '참석하다', definition: 'to attend', phonetic: 'chamseokhada', example: '회의에 참석했어요 (attended the meeting)', notes: 'Participation verb', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['verb', 'participation'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '노력하다', definition: 'to make an effort', phonetic: 'noryeokhada', example: '항상 노력하고 있어요 (always making an effort)', notes: 'Effort verb', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['verb', 'effort'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '환경', definition: 'environment', phonetic: 'hwangyeong', example: '환경 보호가 중요해요 (environmental protection is important)', notes: 'Abstract noun', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['noun', 'environment'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '경제', definition: 'economy', phonetic: 'gyeongje', example: '한국 경제가 발전하고 있어요 (Korean economy is developing)', notes: 'Abstract noun', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['noun', 'economy'], createdAt: new Date().toISOString(), priority: 3 },
        { id: crypto.randomUUID(), word: '사회', definition: 'society', phonetic: 'sahoe', example: '현대 사회는 복잡해요 (modern society is complex)', notes: 'Abstract noun', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['noun', 'society'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '문화', definition: 'culture', phonetic: 'munhwa', example: '한국 문화를 배우고 있어요 (learning Korean culture)', notes: 'Abstract noun', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['noun', 'culture'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '기술', definition: 'technology, skill', phonetic: 'gisul', example: '새로운 기술이 개발됐어요 (new technology was developed)', notes: 'Abstract noun', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['noun', 'technology'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '효과', definition: 'effect, effectiveness', phonetic: 'hyogwa', example: '이 방법은 효과가 있어요 (this method is effective)', notes: 'Result noun', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['noun', 'result'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '원인', definition: 'cause, reason', phonetic: 'wonin', example: '문제의 원인을 찾아야 해요 (need to find the cause of problem)', notes: 'Analysis noun', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['noun', 'analysis'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '결과', definition: 'result, outcome', phonetic: 'gyeolgwa', example: '시험 결과가 나왔어요 (exam results came out)', notes: 'Outcome noun', isBookmarked: false, difficulty: 3, topikLevel: 'TOPIK-2', tags: ['noun', 'outcome'], createdAt: new Date().toISOString(), priority: 5 },
        { id: crypto.randomUUID(), word: '목적', definition: 'purpose, goal', phonetic: 'mokjeok', example: '여행의 목적이 뭐예요? (what\'s the purpose of the trip?)', notes: 'Goal noun', isBookmarked: false, difficulty: 4, topikLevel: 'TOPIK-2', tags: ['noun', 'goal'], createdAt: new Date().toISOString(), priority: 4 },
        { id: crypto.randomUUID(), word: '태도', definition: 'attitude, manner', phonetic: 'taedo', example: '긍정적인 태도가 중요해요 (positive attitude is important)', notes: 'Behavior noun', isBookmarked: false, difficulty: 5, topikLevel: 'TOPIK-2', tags: ['noun', 'behavior'], createdAt: new Date().toISOString(), priority: 3 },
      ]
    }
  };

  // Only initialize if chapters don't already exist in localStorage
  chapters.forEach(chapter => {
    const chapterKey = `chapter_${chapter.id}`;
    if (!localStorage.getItem(chapterKey) && koreanVocabulary[chapter.id as keyof typeof koreanVocabulary]) {
      localStorage.setItem(chapterKey, JSON.stringify(koreanVocabulary[chapter.id as keyof typeof koreanVocabulary]));
    }
  });
};

const Chapters = () => {
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chapterToDelete, setChapterToDelete] = useState<string | null>(null);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [importChapterId, setImportChapterId] = useState<string | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [importTab, setImportTab] = useState("file");
  const [manualImportText, setManualImportText] = useState("");
  const [user, setUser] = useAuthState<any>(null);
  const [showFetchWarning, setShowFetchWarning] = useState(false);
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const savedChapters = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedChapters) {
      try {
        return JSON.parse(savedChapters);
      } catch (e) {
        console.error("Error parsing chapters from localStorage:", e);
      }
    }
    // Create default Korean chapters with preset vocabulary
    const defaultChapters = [{
      id: '1',
      title: '기본 인사말 (Basic Greetings)',
      wordCount: 15,
      progress: 0,
      isBookmarked: true
    }, {
      id: '2',
      title: '일상 대화 (Daily Conversation)',
      wordCount: 20,
      progress: 0,
      isBookmarked: false
    }, {
      id: '3',
      title: '자주 쓰는 문장 (Common Sentences)',
      wordCount: 18,
      progress: 0,
      isBookmarked: true
    }, {
      id: '4',
      title: 'Korean Idiom (한국 관용어)',
      wordCount: 20,
      progress: 0,
      isBookmarked: false
    }, {
      id: '5',
      title: 'Korean Verb (한국어 동사)',
      wordCount: 15,
      progress: 0,
      isBookmarked: false
    }, {
      id: '6',
      title: 'Key Korean Adverb (주요 한국어 부사)',
      wordCount: 20,
      progress: 0,
      isBookmarked: false
    }, {
      id: '7',
      title: 'Korean TOPIK-2 Word (토픽2 어휘)',
      wordCount: 20,
      progress: 0,
      isBookmarked: false
    }];

    // Initialize with preset Korean vocabulary
    initializeKoreanVocabulary(defaultChapters);
    
    return defaultChapters;
  });
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chapters));
  }, [chapters]);

  useAuthEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      console.log('Current user:', user?.email);
      setUser(user);
    });
  }, []);
  useEffect(() => {
    const updatedChapters = chapters.map(chapter => {
      const chapterDataKey = `chapter_${chapter.id}`;
      const savedChapter = localStorage.getItem(chapterDataKey);
      if (savedChapter) {
        try {
          const chapterData = JSON.parse(savedChapter);
          const progress = calculateChapterProgress(chapterData.words || []);
          return {
            ...chapter,
            wordCount: chapterData.words ? chapterData.words.length : chapter.wordCount,
            progress: progress
          };
        } catch (e) {
          console.error(`Error parsing chapter data for ${chapter.id}:`, e);
        }
      }
      return chapter;
    });
    setChapters(updatedChapters);
  }, []);
  const calculateChapterProgress = (words: Word[]): number => {
    if (!words || words.length === 0) return 0;
    const knownWords = words.filter(word => word.isBookmarked).length;
    return Math.round(knownWords / words.length * 100);
  };
  const handleToggleBookmark = (id: string) => {
    setChapters(chapters.map(chapter => chapter.id === id ? {
      ...chapter,
      isBookmarked: !chapter.isBookmarked
    } : chapter));
    const chapter = chapters.find(c => c.id === id);
    toast({
      title: chapter?.isBookmarked ? "Bookmark removed" : "Chapter bookmarked",
      description: `${chapter?.title} has been ${chapter?.isBookmarked ? "removed from" : "added to"} your bookmarks.`
    });
  };
  const handleCreateChapter = () => {
    if (!newChapterTitle.trim()) {
      toast({
        title: "Error",
        description: "Chapter title cannot be empty",
        variant: "destructive"
      });
      return;
    }
    const newId = (Math.max(0, ...chapters.map(c => parseInt(c.id))) + 1).toString();
    const newChapter = {
      id: newId,
      title: newChapterTitle.trim(),
      wordCount: 0,
      progress: 0,
      isBookmarked: false
    };
    const updatedChapters = [...chapters, newChapter];
    setChapters(updatedChapters);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
    setNewChapterTitle('');
    setShowCreateDialog(false);
    toast({
      title: "Chapter created",
      description: `"${newChapter.title}" has been created.`
    });
    const chapterData = {
      id: newId,
      title: newChapter.title,
      words: []
    };
    localStorage.setItem(`chapter_${newId}`, JSON.stringify(chapterData));
    navigate(`/chapters/${newId}`);
  };
  const openDeleteDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChapterToDelete(id);
    setShowDeleteDialog(true);
  };
  const handleDeleteChapter = () => {
    if (!chapterToDelete) return;
    const chapterToRemove = chapters.find(c => c.id === chapterToDelete);
    const updatedChapters = chapters.filter(chapter => chapter.id !== chapterToDelete);
    setChapters(updatedChapters);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
    localStorage.removeItem(`chapter_${chapterToDelete}`);
    setShowDeleteDialog(false);
    setChapterToDelete(null);
    toast({
      title: "Chapter deleted",
      description: `"${chapterToRemove?.title}" has been deleted.`
    });
  };
  const openImportDialog = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImportChapterId(id);
    setShowImportDialog(true);
    setCsvFile(null);
    setCsvPreview([]);
    setManualImportText("");
    setImportTab("file");
  };
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCsvFile(file);
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSV(text);
          setCsvPreview(rows.slice(0, 5));
        } catch (error) {
          console.error("Error parsing CSV file:", error);
          toast({
            title: "Error",
            description: "Failed to parse CSV file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };
  const parseCSV = (text: string): string[][] => {
    const rows = text.split(/\r?\n/).filter(row => row.trim());
    return rows.map(row => {
      const delimiter = row.includes('\t') ? '\t' : ',';
      return row.split(delimiter).map(cell => cell.trim());
    });
  };
  const processManualImport = (): string[][] => {
    if (!manualImportText.trim()) return [];
    const rows = manualImportText.split(/\r?\n/).filter(row => row.trim());
    return rows.map(row => {
      const delimiter = row.includes('\t') ? '\t' : ',';
      return row.split(delimiter).map(cell => cell.trim());
    });
  };
  const handleImportWords = () => {
    if (!importChapterId) return;
    let rows: string[][] = [];
    if (importTab === "file" && csvFile) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          rows = parseCSV(text);
          completeImport(rows);
        } catch (error) {
          console.error("Error processing CSV file:", error);
          toast({
            title: "Error",
            description: "Failed to process the CSV file. Please check the format.",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(csvFile);
    } else if (importTab === "text" && manualImportText.trim()) {
      rows = processManualImport();
      completeImport(rows);
    } else {
      toast({
        title: "Error",
        description: "No data to import.",
        variant: "destructive"
      });
      return;
    }
  };
  const completeImport = (rows: string[][]) => {
    if (!importChapterId || rows.length === 0) return;
    const chapterDataKey = `chapter_${importChapterId}`;
    const savedChapterJson = localStorage.getItem(chapterDataKey);
    let chapterData = {
      id: importChapterId,
      title: chapters.find(c => c.id === importChapterId)?.title || "Chapter",
      words: [] as Word[]
    };
    if (savedChapterJson) {
      try {
        chapterData = JSON.parse(savedChapterJson);
      } catch (e) {
        console.error("Error parsing chapter data:", e);
      }
    }
    const newWords: Word[] = [];
    let skippedCount = 0;
    rows.forEach((row, index) => {
      if (index === 0 && (row[0].toLowerCase() === "word" || row[0].toLowerCase() === "vocabulary" || row[0].toLowerCase() === "term")) {
        return;
      }
      if (row.length < 2 || !row[0].trim() || !row[1].trim()) {
        skippedCount++;
        return;
      }
      newWords.push({
        id: crypto.randomUUID(),
        word: row[0].trim(),
        definition: row[1].trim(),
        example: row.length > 2 ? row[2].trim() : undefined,
        notes: row.length > 3 ? row[3].trim() : undefined,
        phonetic: row.length > 4 ? row[4].trim() : undefined,
        isBookmarked: false
      });
    });
    if (newWords.length === 0) {
      toast({
        title: "Import Failed",
        description: "No valid vocabulary words found in the file.",
        variant: "destructive"
      });
      return;
    }
    const updatedWords = [...chapterData.words, ...newWords];
    chapterData.words = updatedWords;
    localStorage.setItem(chapterDataKey, JSON.stringify(chapterData));
    const updatedChapters = chapters.map(chapter => chapter.id === importChapterId ? {
      ...chapter,
      wordCount: updatedWords.length
    } : chapter);
    setChapters(updatedChapters);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedChapters));
    setShowImportDialog(false);
    toast({
      title: "Import Successful",
      description: `Added ${newWords.length} new vocabulary words${skippedCount > 0 ? ` (${skippedCount} entries skipped)` : ''}.`
    });
  };
  const handleFetchFromGoogleDrive = async () => {
    try {
      // Using a CORS proxy to bypass the CORS restriction
      const originalUrl = 'https://drive.usercontent.google.com/u/0/uc?id=1przBQwmkW4AaqulrcCIhpLoTlWlgqYzh&export=download';
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(originalUrl)}`;
      toast({
        title: "Fetching chapters",
        description: "Downloading chapter data from Google Drive..."
      });
      console.log('Attempting to fetch from:', proxyUrl);

      // Fetch the file through CORS proxy
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }
      const proxyData = await response.json();
      if (!proxyData.contents) {
        throw new Error('No data received from proxy');
      }
      const jsonData = JSON.parse(proxyData.contents);
      if (!jsonData) {
        toast({
          title: "Fetch failed",
          description: "Invalid data format in the file",
          variant: "destructive"
        });
        return;
      }
      console.log('Received data:', jsonData);

      // Process the data similar to the existing restore functionality
      const chaptersData = jsonData.lingualearn_chapters ? JSON.parse(jsonData.lingualearn_chapters) : [];
      if (!Array.isArray(chaptersData)) {
        toast({
          title: "Fetch failed",
          description: "Invalid chapters format in the file",
          variant: "destructive"
        });
        return;
      }

      // Clear existing data and set new data
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chaptersData));

      // Restore individual chapter data
      chaptersData.forEach(chapter => {
        const chapterId = chapter.id;
        if (chapterId) {
          const chapterKey = `chapter_${chapterId}`;
          if (jsonData[chapterKey]) {
            localStorage.setItem(chapterKey, jsonData[chapterKey]);
          }
        }
      });
      setChapters(chaptersData);
      toast({
        title: "Fetch successful",
        description: `Fetched ${chaptersData.length} chapters from Google Drive.`
      });
    } catch (error) {
      console.error('Error fetching from Google Drive:', error);
      toast({
        title: "Fetch failed",
        description: `There was an error fetching the chapters: ${error instanceof Error ? error.message : 'Unknown error'}. The file might not be publicly accessible or there may be a network issue.`,
        variant: "destructive"
      });
    }
  };
  const handleRestoreFromSupabase = async () => {
    try {
      toast({
        title: "Fetching chapters",
        description: "Downloading chapter data from Supabase database..."
      });

      // First try to fetch from the database table
      const {
        data: dbData,
        error: dbError
      } = await supabase.from('chapter_vocabulary').select('data').limit(1);
      if (dbError) {
        console.error('Database error:', dbError);
        // Fallback to storage if database fails
        return await handleRestoreFromStorage();
      }
      if (dbData && dbData.length > 0 && dbData[0].data) {
        const parsedData = dbData[0].data as any;
        await processChapterData(parsedData, "database", true); // true = merge mode
        return;
      }

      // If no data in database, try storage as fallback
      await handleRestoreFromStorage();
    } catch (error) {
      console.error('Error restoring chapters:', error);
      toast({
        title: "Restore failed",
        description: "There was an error restoring the chapters. Check console for details.",
        variant: "destructive"
      });
    }
  };
  const handleRestoreFromStorage = async () => {
    const {
      data,
      error
    } = await supabase.storage.from('chapters').download('Chaptersandvocab.json');
    if (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Restore failed",
        description: `Error downloading file: ${error.message}`,
        variant: "destructive"
      });
      return;
    }
    const jsonData = await data.text();
    const parsedData = JSON.parse(jsonData);
    await processChapterData(parsedData, "storage", true); // true = merge mode
  };
  const processChapterData = async (parsedData: any, source: string, mergeMode: boolean = false) => {
    if (!parsedData) {
      toast({
        title: "Restore failed",
        description: "Invalid data format in backup file",
        variant: "destructive"
      });
      return;
    }
    const chaptersData = parsedData.lingualearn_chapters ? JSON.parse(parsedData.lingualearn_chapters) : [];
    if (!Array.isArray(chaptersData)) {
      toast({
        title: "Restore failed",
        description: "Invalid chapters format in backup file",
        variant: "destructive"
      });
      return;
    }

    // Filter to keep only Korean chapters (chapters with Korean characters in title or from known Korean presets)
    const koreanChapters = chaptersData.filter(chapter => {
      const hasKoreanChars = /[\u3131-\uD79D]/.test(chapter.title);
      return hasKoreanChars;
    });

    if (mergeMode) {
      // Merge mode: Keep existing chapters and add new ones
      const existingChapters = chapters;
      const existingIds = new Set(existingChapters.map(c => c.id));
      
      // Only add chapters that don't already exist
      const newChapters = koreanChapters.filter(c => !existingIds.has(c.id));
      const mergedChapters = [...existingChapters, ...newChapters];
      
      // Update localStorage with merged chapters
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(mergedChapters));
      
      // Add individual chapter data for new chapters only
      newChapters.forEach(chapter => {
        const chapterId = chapter.id;
        if (chapterId) {
          const chapterKey = `chapter_${chapterId}`;
          if (parsedData[chapterKey]) {
            localStorage.setItem(chapterKey, parsedData[chapterKey]);
          }
        }
      });
      
      setChapters(mergedChapters);
      toast({
        title: "Fetch successful",
        description: `Added ${newChapters.length} new Korean chapters from Supabase ${source}. Your existing chapters were kept.`
      });
    } else {
      // Replace mode: Clear and replace all chapters
      localStorage.removeItem(LOCAL_STORAGE_KEY);

      // Remove all existing chapter data
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chapter_')) {
          localStorage.removeItem(key);
        }
      }

      // Set new chapters data
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(koreanChapters));

      // Restore individual chapter data
      koreanChapters.forEach(chapter => {
        const chapterId = chapter.id;
        if (chapterId) {
          const chapterKey = `chapter_${chapterId}`;
          if (parsedData[chapterKey]) {
            localStorage.setItem(chapterKey, parsedData[chapterKey]);
          }
        }
      });
      setChapters(koreanChapters);
      toast({
        title: "Restore successful",
        description: `Restored ${koreanChapters.length} Korean chapters from Supabase ${source}.`
      });
    }
  };
  const handleRestoreChapters = (data: Record<string, any>) => {
    try {
      // First restore the chapters list
      if (data.lingualearn_chapters) {
        localStorage.setItem(LOCAL_STORAGE_KEY, data.lingualearn_chapters);
      }

      // Then restore individual chapters
      let restoredCount = 0;
      Object.entries(data).forEach(([key, value]) => {
        if (key !== 'lingualearn_chapters' && key.startsWith('chapter_')) {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
          restoredCount++;
        }
      });

      // Reload chapters from localStorage after restore
      const savedChapters = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedChapters) {
        try {
          setChapters(JSON.parse(savedChapters));
        } catch (e) {
          console.error("Error parsing chapters from localStorage:", e);
        }
      }
      toast({
        title: "Restore successful",
        description: `${restoredCount} chapters have been restored.`
      });

      // Reload the page to reflect changes
      window.location.reload();
    } catch (error) {
      console.error('Error during restore:', error);
      toast({
        title: "Restore failed",
        description: "There was an error restoring the chapters.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateChapters = async () => {
    try {
      toast({
        title: "Updating chapters",
        description: "Uploading current chapter data to storage..."
      });

      // Collect all chapter data from localStorage
      const data: Record<string, any> = {};
      
      // First get the chapter list
      const chapters = localStorage.getItem('lingualearn_chapters');
      if (chapters) {
        data['lingualearn_chapters'] = chapters;
      }

      // Then get individual chapter data
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('chapter_')) {
          const item = localStorage.getItem(key);
          if (item) {
            data[key] = item;
          }
        }
      }

      if (Object.keys(data).length === 0) {
        toast({
          title: "Update failed",
          description: "No chapter data found to upload.",
          variant: "destructive"
        });
        return;
      }

      // Convert to JSON
      const jsonString = JSON.stringify(data);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Upload to Supabase storage
      console.log('Attempting to upload to storage bucket "chapters"...');
      const { error } = await supabase.storage
        .from('chapters')
        .upload('Chaptersandvocab.json', blob, {
          upsert: true
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      console.log('Storage upload successful!');

      toast({
        title: "Update successful",
        description: `Chapter data has been updated in storage.`
      });
    } catch (error) {
      console.error('Error updating chapters:', error);
      toast({
        title: "Update failed",
        description: `Error updating chapters: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };
  const filteredChapters = chapters.filter(chapter => chapter.title.toLowerCase().includes(searchQuery.toLowerCase()));
  return <div className="min-h-screen bg-gray-50 mx-[3px] px-[3px] py-[5px]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Chapters</h1>
          </div>
          <div className="flex gap-2">
            <ChapterBackupRestore onRestore={handleRestoreChapters} />
            
            <Button variant="outline" onClick={() => setShowFetchWarning(true)} className="flex items-center gap-2 bg-green-400 hover:bg-green-300">
              <Download className="h-4 w-4" />
              Fetch Chapters
            </Button>
            {user?.email === 'dhirajsahani8541@gmail.com' && (
              <Button variant="outline" onClick={handleUpdateChapters} className="flex items-center gap-2 bg-blue-400 hover:bg-blue-300">
                <Upload className="h-4 w-4" />
                Update Storage
              </Button>
            )}
            <Button className="sm:self-end" onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Chapter
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredChapters.map(chapter => <div key={chapter.id} className="relative">
              <ChapterCard id={chapter.id} title={chapter.title} wordCount={chapter.wordCount} progress={chapter.progress} isBookmarked={chapter.isBookmarked} onToggleBookmark={handleToggleBookmark} onClick={() => navigate(`/chapters/${chapter.id}`)} />
              <div className="absolute top-2 right-2 flex gap-2">
                
                <Button variant="ghost" size="sm" onClick={e => openDeleteDialog(chapter.id, e)} className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full" title="Delete chapter">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>)}
        </div>

        {filteredChapters.length === 0 && <div className="text-center py-12">
            <p className="text-gray-500">No chapters found. Create your first chapter to get started!</p>
          </div>}

        <AlertDialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Create New Chapter</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a name for your new chapter. You can add words to it after creation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input placeholder="Chapter title (e.g., Biology Unit 1, GRE High Frequency)" value={newChapterTitle} onChange={e => setNewChapterTitle(e.target.value)} />
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleCreateChapter}>Create</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this chapter? This action cannot be undone and all words in this chapter will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setChapterToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteChapter} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Import Vocabulary</AlertDialogTitle>
              <AlertDialogDescription>
                Import vocabulary words into this chapter from a CSV file or by pasting text.
              </AlertDialogDescription>
            </AlertDialogHeader>
            
            <Tabs value={importTab} onValueChange={setImportTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="file">From File</TabsTrigger>
                <TabsTrigger value="text">Paste Text</TabsTrigger>
              </TabsList>
              
              <TabsContent value="file" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-2">Select CSV or Text File</p>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      <span>Format: Word, Definition, Example, Notes, Phonetic</span>
                    </div>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" className="h-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-md">
                        <p>Your CSV file should have the following columns:<br />
                        <span className="font-medium">Word</span>, <span className="font-medium">Definition</span>, Example (optional), Notes (optional), Phonetic (optional)</p>
                        <p className="mt-1">Example: <code>Apple,A fruit,The apple is red.,Common fruit,/ˈæpəl/</code></p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="border-2 border-dashed border-gray-200 rounded-md p-6 text-center">
                  <Input type="file" id="csv-upload" onChange={handleCsvFileChange} accept=".csv,.txt,.tsv" className="mb-4" />
                  <p className="text-sm text-gray-500">Supports CSV, TSV, or TXT files</p>
                </div>
                
                {csvPreview.length > 0 && <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
                    <div className="bg-gray-50 p-3 rounded text-sm overflow-x-auto max-h-40">
                      <table className="min-w-full">
                        <tbody>
                          {csvPreview.map((row, idx) => <tr key={idx} className={idx === 0 ? "font-medium" : ""}>
                              {row.map((cell, cellIdx) => <td key={cellIdx} className="p-1 border-b border-gray-200">{cell}</td>)}
                            </tr>)}
                        </tbody>
                      </table>
                    </div>
                  </div>}
              </TabsContent>
              
              <TabsContent value="text">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium mb-2">Paste Vocabulary</p>
                    <div className="text-xs text-gray-500 flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      <span>One word per line: Word, Definition, Example, Notes</span>
                    </div>
                  </div>
                </div>
                <div className="border border-gray-200 rounded-md">
                  <textarea className="w-full h-40 p-3 text-sm resize-none border-0 rounded-md focus:ring-0" placeholder="vocabulary, meaning, example, notes
apple, a round fruit, The apple is red, Common fruit" value={manualImportText} onChange={e => setManualImportText(e.target.value)} />
                </div>
              </TabsContent>
            </Tabs>
            
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleImportWords}>Import Words</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Fetch Chapters Warning Dialog */}
        <AlertDialog open={showFetchWarning} onOpenChange={setShowFetchWarning}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Fetch Chapters from Cloud</AlertDialogTitle>
              <AlertDialogDescription>
                This will download Korean chapters from your cloud backup and add any new ones to your current chapters. 
                Your existing chapters will NOT be deleted or replaced.
                <br /><br />
                Only chapters with Korean content will be fetched.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                setShowFetchWarning(false);
                handleRestoreFromSupabase();
              }}>
                Fetch Chapters
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>;
};
export default Chapters;