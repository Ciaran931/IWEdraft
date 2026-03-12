ALTER TABLE public.texts
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;
