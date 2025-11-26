import { supabase } from "@/integrations/supabase/client";

export interface Certificate {
  id: string;
  certificate_name: string;
  certificate_url: string;
  issue_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export const fetchAllCertificates = async () => {
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .order('issue_date', { ascending: false });
  
  if (error) throw error;
  return data as Certificate[];
};

export const createCertificate = async (certificate: Omit<Certificate, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('certificates')
    .insert(certificate)
    .select()
    .single();
  
  if (error) throw error;
  return data as Certificate;
};

export const updateCertificate = async (id: string, updates: Partial<Certificate>) => {
  const { data, error } = await supabase
    .from('certificates')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data as Certificate;
};

export const deleteCertificate = async (id: string) => {
  const { error } = await supabase
    .from('certificates')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
};

export const uploadCertificateFile = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('certificates')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('certificates')
    .getPublicUrl(filePath);

  return data.publicUrl;
};
