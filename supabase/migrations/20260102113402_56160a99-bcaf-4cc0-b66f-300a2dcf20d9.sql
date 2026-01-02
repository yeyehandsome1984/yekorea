-- Create study_links table for storing resource links
CREATE TABLE public.study_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  subject TEXT NOT NULL DEFAULT 'Korean',
  description TEXT,
  usefulness INTEGER NOT NULL DEFAULT 3 CHECK (usefulness >= 1 AND usefulness <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.study_links ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (matching existing pattern)
CREATE POLICY "Anyone can view study links" 
ON public.study_links 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert study links" 
ON public.study_links 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update study links" 
ON public.study_links 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete study links" 
ON public.study_links 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_study_links_updated_at
BEFORE UPDATE ON public.study_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();