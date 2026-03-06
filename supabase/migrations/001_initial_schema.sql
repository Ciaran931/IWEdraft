-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLES
-- ============================================================

-- Public users (mirrors auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  language_code TEXT NOT NULL DEFAULT 'pl',
  level TEXT,
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trigger: auto-create public.users row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, language_code)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'language_code', 'pl')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Vocab words (global dictionary)
CREATE TABLE public.vocab_words (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  pos TEXT NOT NULL,
  en_definition TEXT NOT NULL,
  examples TEXT[] NOT NULL DEFAULT '{}',
  trigger_words TEXT[],
  translations JSONB NOT NULL DEFAULT '{}'
);

-- SRS decks
CREATE TABLE public.srs_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  deck_type TEXT NOT NULL CHECK (deck_type IN ('premade', 'custom', 'grammar', 'niche')),
  language_code TEXT NOT NULL DEFAULT 'en',
  is_locked BOOLEAN NOT NULL DEFAULT false
);

-- SRS cards (central table for both vocab and grammar)
CREATE TABLE public.srs_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  card_type TEXT NOT NULL CHECK (card_type IN ('vocab', 'grammar')),
  content_id TEXT NOT NULL,
  deck_id UUID REFERENCES public.srs_decks(id) ON DELETE SET NULL,
  ease_factor FLOAT NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 1,
  repetitions INTEGER NOT NULL DEFAULT 0,
  due_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_reviewed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'learning', 'review', 'mature')),
  source_text_id TEXT,
  source_sentence TEXT,
  context_definition TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Texts (reading library)
CREATE TABLE public.texts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  grammar_lesson_id TEXT,
  paragraphs JSONB NOT NULL DEFAULT '[]'
);

-- Text translations (per language)
CREATE TABLE public.text_translations (
  text_id TEXT NOT NULL REFERENCES public.texts(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL,
  paragraphs JSONB NOT NULL DEFAULT '[]',
  PRIMARY KEY (text_id, language_code)
);

-- Context-specific word definition overrides
CREATE TABLE public.text_word_overrides (
  text_id TEXT NOT NULL REFERENCES public.texts(id) ON DELETE CASCADE,
  word_id TEXT NOT NULL REFERENCES public.vocab_words(id) ON DELETE CASCADE,
  en_definition TEXT NOT NULL,
  translations JSONB NOT NULL DEFAULT '{}',
  PRIMARY KEY (text_id, word_id)
);

-- Grammar lessons
CREATE TABLE public.grammar_lessons (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level TEXT NOT NULL,
  category TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  explanation JSONB NOT NULL DEFAULT '[]'
);

-- Grammar quiz questions
CREATE TABLE public.grammar_questions (
  id TEXT PRIMARY KEY,
  lesson_id TEXT NOT NULL REFERENCES public.grammar_lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT NOT NULL
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_srs_cards_user_due ON public.srs_cards(user_id, due_date);
CREATE INDEX idx_srs_cards_user_type ON public.srs_cards(user_id, card_type);
CREATE INDEX idx_texts_level ON public.texts(level);
CREATE INDEX idx_grammar_questions_lesson ON public.grammar_questions(lesson_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocab_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_word_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.text_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grammar_questions ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Users read own row" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own row" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- srs_cards
CREATE POLICY "Users read own cards" ON public.srs_cards
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own cards" ON public.srs_cards
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own cards" ON public.srs_cards
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own cards" ON public.srs_cards
  FOR DELETE USING (auth.uid() = user_id);

-- srs_decks
CREATE POLICY "Users read own or premade decks" ON public.srs_decks
  FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users insert own decks" ON public.srs_decks
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own decks" ON public.srs_decks
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own decks" ON public.srs_decks
  FOR DELETE USING (auth.uid() = user_id);

-- Read-only public tables (admin-seeded)
CREATE POLICY "Authenticated read vocab_words" ON public.vocab_words
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read text_word_overrides" ON public.text_word_overrides
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read texts" ON public.texts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read text_translations" ON public.text_translations
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read grammar_lessons" ON public.grammar_lessons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read grammar_questions" ON public.grammar_questions
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- STREAK FUNCTION (RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_streak(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
  v_last_active DATE;
  v_today DATE := CURRENT_DATE;
BEGIN
  SELECT last_active_at::DATE INTO v_last_active
  FROM public.users
  WHERE id = p_user_id;

  IF v_last_active = v_today THEN
    -- Already active today, nothing to do
    RETURN;
  ELSIF v_last_active = v_today - INTERVAL '1 day' THEN
    UPDATE public.users
    SET streak_days = streak_days + 1, last_active_at = now()
    WHERE id = p_user_id;
  ELSE
    UPDATE public.users
    SET streak_days = 1, last_active_at = now()
    WHERE id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
