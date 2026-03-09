-- Allow anonymous (unauthenticated) users to read content tables
-- so the input/reading section works without login.

CREATE POLICY "anon_select_texts"
  ON texts FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_text_translations"
  ON text_translations FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_text_questions"
  ON text_questions FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_vocab_words"
  ON vocab_words FOR SELECT TO anon USING (true);

CREATE POLICY "anon_select_text_word_overrides"
  ON text_word_overrides FOR SELECT TO anon USING (true);
