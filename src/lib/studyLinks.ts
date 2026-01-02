import { supabase } from "@/integrations/supabase/client";

export interface StudyLink {
  id: string;
  url: string;
  subject: string;
  description: string | null;
  usefulness: number;
  created_at: string;
  updated_at: string;
}

export const PRESET_SUBJECTS = ["Korean", "Accounting", "Finance", "Programming"];

export const fetchAllStudyLinks = async () => {
  const { data, error } = await supabase
    .from('study_links')
    .select('*')
    .order('usefulness', { ascending: false });
  
  if (error) throw error;
  return data as StudyLink[];
};

export const createStudyLink = async (link: Omit<StudyLink, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('study_links')
    .insert(link)
    .select()
    .single();
  
  if (error) throw error;
  return data as StudyLink;
};

export const updateStudyLink = async (id: string, updates: Partial<StudyLink>) => {
  const { data, error } = await supabase
    .from('study_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as StudyLink;
};

export const deleteStudyLink = async (id: string) => {
  const { error } = await supabase
    .from('study_links')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};
