-- Create certificates table
CREATE TABLE public.certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_name TEXT NOT NULL,
  certificate_url TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Create policies for certificate access
CREATE POLICY "Anyone can view certificates" 
ON public.certificates 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert certificates" 
ON public.certificates 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update certificates" 
ON public.certificates 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete certificates" 
ON public.certificates 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for certificate uploads
CREATE POLICY "Anyone can view certificate files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificates');

CREATE POLICY "Anyone can upload certificate files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certificates');

CREATE POLICY "Anyone can delete certificate files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'certificates');