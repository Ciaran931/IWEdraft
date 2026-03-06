-- Add category to texts table to distinguish graded readers from immersion content
ALTER TABLE public.texts
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'graded';
