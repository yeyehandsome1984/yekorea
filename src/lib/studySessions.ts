import { supabase } from "@/integrations/supabase/client";

export interface StudySession {
  id: string;
  topic: string;
  study_date: string;
  summary: string | null;
  hours: number;
  image_urls: string[];
  created_at: string;
  updated_at: string;
}

export const fetchAllStudySessions = async () => {
  const { data, error } = await supabase
    .from('study_sessions')
    .select('*')
    .order('study_date', { ascending: false });
  
  if (error) throw error;
  return data as StudySession[];
};

export const createStudySession = async (session: Omit<StudySession, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert(session)
    .select()
    .single();
  
  if (error) throw error;
  return data as StudySession;
};

export const updateStudySession = async (id: string, updates: Partial<StudySession>) => {
  const { data, error } = await supabase
    .from('study_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as StudySession;
};

export const deleteStudySession = async (id: string) => {
  const { error } = await supabase
    .from('study_sessions')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const uploadStudyImage = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('study-images')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('study-images')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
