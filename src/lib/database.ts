import { supabase } from "@/integrations/supabase/client";

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Word {
  id: string;
  chapter_id: string;
  word: string;
  definition: string;
  phonetic?: string;
  example?: string;
  notes?: string;
  is_bookmarked: boolean;
  is_known: boolean;
  difficulty: number;
  topik_level?: string;
  tags: string[];
  priority: number;
  created_at?: string;
  updated_at?: string;
}

// Chapter operations
export const fetchAllChapters = async () => {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Chapter[];
};

export const fetchChapter = async (id: string) => {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) throw error;
  return data as Chapter;
};

export const createChapter = async (title: string, description?: string) => {
  const { data, error } = await supabase
    .from('chapters')
    .insert({ title, description })
    .select()
    .single();
  
  if (error) throw error;
  return data as Chapter;
};

export const updateChapter = async (id: string, updates: Partial<Chapter>) => {
  const { data, error } = await supabase
    .from('chapters')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Chapter;
};

export const deleteChapter = async (id: string) => {
  const { error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

// Word operations
export const fetchWordsByChapter = async (chapterId: string) => {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('chapter_id', chapterId)
    .order('created_at', { ascending: true });
  
  if (error) throw error;
  return data as Word[];
};

export const createWord = async (word: Omit<Word, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('words')
    .insert(word)
    .select()
    .single();
  
  if (error) throw error;
  return data as Word;
};

export const createWords = async (words: Omit<Word, 'id' | 'created_at' | 'updated_at'>[]) => {
  const { data, error } = await supabase
    .from('words')
    .insert(words)
    .select();
  
  if (error) throw error;
  return data as Word[];
};

export const updateWord = async (id: string, updates: Partial<Word>) => {
  const { data, error } = await supabase
    .from('words')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Word;
};

export const deleteWord = async (id: string) => {
  const { error } = await supabase
    .from('words')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const fetchAllWords = async () => {
  const { data, error } = await supabase
    .from('words')
    .select('*');
  
  if (error) throw error;
  return data as Word[];
};
