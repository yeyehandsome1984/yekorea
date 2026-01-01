-- Create sentences table
CREATE TABLE public.sentences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  korean TEXT NOT NULL,
  english TEXT NOT NULL,
  chinese TEXT,
  grammar_points TEXT,
  topic TEXT,
  topik_level TEXT,
  category TEXT NOT NULL,
  difficulty INTEGER NOT NULL DEFAULT 3,
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  linked_vocabulary JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.sentences ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth)
CREATE POLICY "Anyone can view sentences" 
ON public.sentences 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert sentences" 
ON public.sentences 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update sentences" 
ON public.sentences 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete sentences" 
ON public.sentences 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_sentences_updated_at
BEFORE UPDATE ON public.sentences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();