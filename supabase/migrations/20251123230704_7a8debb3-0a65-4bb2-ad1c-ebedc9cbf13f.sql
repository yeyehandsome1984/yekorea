-- Create chapters table for globally shared content
CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create words table for chapter vocabulary
CREATE TABLE public.words (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  phonetic TEXT,
  example TEXT,
  notes TEXT,
  is_bookmarked BOOLEAN DEFAULT false,
  is_known BOOLEAN DEFAULT false,
  difficulty INTEGER DEFAULT 3 CHECK (difficulty >= 1 AND difficulty <= 5),
  topik_level TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  priority INTEGER DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_words_chapter_id ON public.words(chapter_id);
CREATE INDEX idx_chapters_title ON public.chapters(title);

-- Enable Row Level Security
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

-- Public read access (no login required)
CREATE POLICY "Anyone can view chapters"
  ON public.chapters
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view words"
  ON public.words
  FOR SELECT
  USING (true);

-- Public write access (anyone can add/edit/delete)
CREATE POLICY "Anyone can insert chapters"
  ON public.chapters
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update chapters"
  ON public.chapters
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete chapters"
  ON public.chapters
  FOR DELETE
  USING (true);

CREATE POLICY "Anyone can insert words"
  ON public.words
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update words"
  ON public.words
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete words"
  ON public.words
  FOR DELETE
  USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_words_updated_at
  BEFORE UPDATE ON public.words
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();