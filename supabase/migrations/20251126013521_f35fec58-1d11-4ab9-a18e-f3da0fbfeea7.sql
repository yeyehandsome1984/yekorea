-- Create study_sessions table
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic TEXT NOT NULL,
  study_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT,
  hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  image_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching the existing pattern for chapters/words)
CREATE POLICY "Anyone can view study sessions"
ON public.study_sessions
FOR SELECT
USING (true);

CREATE POLICY "Anyone can insert study sessions"
ON public.study_sessions
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update study sessions"
ON public.study_sessions
FOR UPDATE
USING (true);

CREATE POLICY "Anyone can delete study sessions"
ON public.study_sessions
FOR DELETE
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_study_sessions_updated_at
BEFORE UPDATE ON public.study_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for study session images
INSERT INTO storage.buckets (id, name, public)
VALUES ('study-images', 'study-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for study images
CREATE POLICY "Anyone can view study images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'study-images');

CREATE POLICY "Anyone can upload study images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'study-images');

CREATE POLICY "Anyone can update study images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'study-images');

CREATE POLICY "Anyone can delete study images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'study-images');