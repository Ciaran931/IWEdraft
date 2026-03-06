-- Text comprehension and discussion questions
CREATE TABLE public.text_questions (
  id TEXT PRIMARY KEY,
  text_id TEXT NOT NULL REFERENCES public.texts(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('comprehension', 'discussion')),
  question TEXT NOT NULL,
  options TEXT[],
  correct_index INTEGER,
  explanation TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_text_questions_text ON public.text_questions(text_id);

ALTER TABLE public.text_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read text_questions" ON public.text_questions
  FOR SELECT TO authenticated USING (true);
