
Input with Ease
Full Architecture Brief for Development

An English language learning platform built on comprehensible input, spaced repetition, and grammar visualisation.

1. Project Overview
Input with Ease is a web-based English language learning platform designed around the comprehensible input method. It is divided into three core learning sections — Input, Vocab, and Grammar — supported by a user dashboard. All sections are unified under a single Supabase backend with shared authentication and a shared SRS (Spaced Repetition System) engine.

Core Sections
Input — A library of readable texts in bilingual format (English + learner's native language)
Vocab — A flashcard system powered by an SRS engine, with premade and custom decks
Grammar — Structured lessons from A1 to C2, with quiz-based SRS and a progress grid
Dashboard — A home screen showing progress, streak, and grammar overview

Tech Stack
Layer
Technology
Rationale
Frontend
Next.js
React-based, handles routing, SSR, and component architecture cleanly
Backend / Auth / DB
Supabase
Provides auth, PostgreSQL database, and real-time capabilities
SRS Algorithm
SM-2 (custom implementation)
Open algorithm; basis of Anki; well-understood and effective
Styling
Tailwind CSS
Utility-first, pairs well with Next.js, fast to iterate


2. System Architecture
All four sections share a single user layer. The SRS engine is a shared service used by both Vocab and Grammar — it is not duplicated. The only difference between a vocab card and a grammar card is the content_id it points to and how it is rendered.

Auth / User Layer (Supabase)
    │
    ├── Input Section
    │       └── word clicks → save to srs_cards (vocab)
    │
    ├── Vocab Section
    │       └── reads / writes srs_cards (card_type: vocab)
    │
    ├── Grammar Section
    │       └── reads / writes srs_cards (card_type: grammar)
    │
    └── Dashboard
            └── queries srs_cards for all progress data

3. Database Schema (Supabase / PostgreSQL)
users (managed by Supabase Auth)
Field
Type
Notes
id
uuid
Primary key, managed by Supabase
email
text


language_code
text
User's native language. e.g. 'pl', 'fr'. Drives translation display
level
text
Set by placement quiz. 'A1' through 'C2'
streak_days
integer
Incremented daily on any review activity
last_active_at
timestamp




srs_cards — The Central SRS Table
This single table powers both Vocab flashcards and Grammar quiz reviews. card_type determines what content_id points to and how the card is rendered.

Field
Type
Notes
id
uuid
Primary key
user_id
uuid
Foreign key → users
card_type
text
'vocab' or 'grammar'
content_id
text
Points to vocab_words.id or grammar_questions.id
deck_id
uuid
Foreign key → srs_decks
ease_factor
float
SM-2. Starts at 2.5, floor of 1.3
interval
integer
Days until next review. Starts at 1
repetitions
integer
Successful review count
due_date
timestamp
Next scheduled review date
last_reviewed_at
timestamp


status
text
'new' | 'learning' | 'review' | 'mature'
source_text_id
text
Which text the word was found in (vocab cards only)
source_sentence
text
The exact sentence from the text (vocab cards only)
context_definition
text
Context-specific override definition (vocab cards only)


srs_decks
Field
Type
Notes
id
uuid
Primary key
user_id
uuid
Null for premade / shared decks
name
text
e.g. 'My Reading Deck', '1000 Most Common Words'
deck_type
text
'premade' | 'custom' | 'grammar' | 'niche'
language_code
text
Target language of the deck
is_locked
boolean
True = behind paywall (for future niche decks)


vocab_words — Global Dictionary
Words are stored once globally. Translations are nested by language code so adding a new language requires no schema changes — only new data.

Field
Type
Notes
id
text
e.g. 'again', 'give-up' (slugified)
word
text
Display form
pos
text
'noun' | 'verb' | 'adverb' | 'phrasal_verb' etc
en_definition
text
Base English definition
examples
text[]
Array of example sentences (global fallback)
trigger_words
text[]
For phrasal verbs only. e.g. ['give', 'up']
translations
jsonb
{ pl: { word, definition }, fr: { word, definition } }


text_word_overrides — Context-Specific Definitions
When a word has a different meaning in a specific text (e.g. 'run' meaning 'to manage' in a business text), a row here overrides the global definition for that text only.

Field
Type
Notes
text_id
text
Which text this override applies to
word_id
text
Foreign key → vocab_words
en_definition
text
Context-specific override
translations
jsonb
Context-specific translation overrides by language code


texts — Reading Library
Field
Type
Notes
id
text
e.g. 'war-of-the-worlds'
title
text


level
text
Approximate CEFR level
grammar_lesson_id
text
Optional link to a grammar lesson for companion texts
paragraphs
jsonb
Array of { id, sentences: string[] }


text_translations — Per-Language Text Content
Field
Type
Notes
text_id
text
Foreign key → texts
language_code
text
e.g. 'pl'
paragraphs
jsonb
Array of { id, sentences: string[] } — aligned by paragraph and sentence index


grammar_lessons
Field
Type
Notes
id
text
e.g. 'present-simple-positive'
title
text


level
text
'A1' through 'C2'
category
text
e.g. 'Tenses', 'Nouns', 'Conditionals'
order
integer
Display order within level + category
explanation
jsonb
Array of content blocks — see Grammar section


grammar_questions
Field
Type
Notes
id
text
e.g. 'present-simple-positive-q1'
lesson_id
text
Foreign key → grammar_lessons
question
text
The question text
options
text[]
Array of 4 answer strings
correct_index
integer
0-based index of the correct option
explanation
text
Shown after answering — explains why the answer is correct


4. SRS Engine (SM-2 Algorithm)
The SRS engine is a single shared service used identically by both Vocab and Grammar. It is approximately 30 lines of logic. After each review, the user rates their recall, and the engine updates the card's schedule.

Rating Scale
Rating
Button Label
Effect
0
Again
Reset interval to 1 day. Status back to 'learning'
1
Hard
interval × 1.2
2
Good
interval × ease_factor
3
Easy
interval × ease_factor × 1.3. ease_factor + 0.15


Status Transitions
new  →  learning  (first review attempt)
learning  →  review  (after first successful Good/Easy rating)
review  →  mature  (when interval exceeds 21 days)
mature / review  →  learning  (if rated Again)

ease_factor never drops below 1.3. The SM-2 algorithm is the same one used by Anki and is well-documented online. No external library is required — implement directly from the spec.

Card Rendering by Type
The review session loop is identical for both card types. Only the render component differs:

card_type
Front
Back
vocab
English word + part of speech
Translation, context definition, source sentence, source text name
grammar
Multiple choice question
Correct answer revealed + explanation text


5. Input Section — Reading UI
Text Data Format
Texts are stored as plain structured JSON — no HTML, no hardcoded spans. JavaScript generates all word spans at runtime. Two files per text: the source English file and one translation file per language.

// texts/war-of-the-worlds.json (source, language-agnostic)
{
  "text_id": "war-of-the-worlds",
  "paragraphs": [
    {
      "id": 1,
      "sentences": [
        "To the eastward, these little boats were grey.",
        "And just below us was a rock with an arch."
      ]
    }
  ]
}

// texts/war-of-the-worlds.pl.json (translation)
{
  "text_id": "war-of-the-worlds",
  "language_code": "pl",
  "paragraphs": [
    {
      "id": 1,
      "sentences": [
        "Na wschodzie te male lodki byly szare.",
        "A tuz pod nami znajdowala sie skala z lukiem."
      ]
    }
  ]
}

Word Tokenisation — JS Runtime
On page load, JavaScript fetches both the source text and the user's preferred translation. It then tokenises each English sentence before rendering, handling phrasal verbs as a first pass:

function tokenise(sentence, phrasalVerbs) {
  // Pass 1: Scan for phrasal verbs — mark those word positions
  // Pass 2: Wrap remaining single words
  // Returns: array of token objects { type, id, display }
}

// Each token renders as a span:
// <span class="word" data-id="rock" data-sentence="2" data-para="1">rock</span>
// <span class="word phrasal" data-id="give-up" data-sentence="4" data-para="2">give up</span>

Layout — Desktop vs Mobile
Platform
Layout
Behaviour
Desktop
Two side-by-side columns (English left, Polish right)
Both columns visible simultaneously. Sentence highlight applied to both.
Mobile
Two swipeable tabs (English | Polish)
Each language in its own full-width container. Highlights apply to both even when off-screen.


Sentence Highlighting
When a word is clicked, highlighting fires across both language containers simultaneously using shared data attributes. The word receives a strong highlight; its parent sentence receives a soft highlight.

// On word click:
const paraId = word.dataset.para;
const sentenceId = word.dataset.sentence;

// Highlight matching sentences in BOTH containers
document.querySelectorAll(`[data-para="${paraId}"][data-sentence="${sentenceId}"]`)
  .forEach(s => s.classList.add('sentence-highlight'));

// Highlight the specific clicked word
word.classList.add('selected');

Word Lookup Panel
Desktop: a persistent sidebar (left side) that remains empty until a word is clicked, then populates. Mobile: an anchored tooltip that appears near the clicked word and dismisses on any non-word click.

Panel Element
Content Source
Word + POS
vocab_words.word + vocab_words.pos
Translation
vocab_words.translations[user.language_code].word
Definition (EN)
text_word_overrides.en_definition ?? vocab_words.en_definition
Definition (translated)
text_word_overrides.translations[lang] ?? vocab_words.translations[lang].definition
Example sentence
The exact sentence from the text the user clicked in
Add to Flashcards button
Triggers srs_cards insert — see below


Context-specific definitions from text_word_overrides take priority over the global vocab_words definition. If no override exists, fall back to global.

Add to Flashcards
When a user clicks 'Add to Flashcards', a new srs_cards row is created. The flashcard captures the context — the specific sentence and definition from the text — not the generic global entry.

srs_cards field
Value saved
card_type
'vocab'
content_id
vocab_words.id
source_text_id
Current text ID
source_sentence
The full sentence the word appeared in
context_definition
text_word_overrides.en_definition ?? vocab_words.en_definition
status
'new'
due_date
Today
ease_factor
2.5


The button has three states: default ('+ Add to Flashcards'), success ('Added ✓'), and already-saved ('Already in your deck'). The already-saved check queries srs_cards before insert.

Reading UI Tabs
Each text has three tabs across the top:
Read — the bilingual text reader
Understand — multiple choice comprehension questions about the text (static, same for all users, no saving)
Discuss — open-ended discussion questions (static text, no user submission)

Navigation — Chapters / Index
Longer texts display a collapsible chapter index at the top of the Read tab. Clicking a chapter scrolls to that paragraph group. Prevents endless scrolling on long texts.

6. Vocab Section — Flashcard System
Deck Types
deck_type
Description
How Populated
premade
500–1000 most common English words
Seeded at launch, same for all users
custom
Words saved from reading
User clicks 'Add to Flashcards' in Input section
grammar
Grammar quiz questions
Auto-created when a grammar lesson is completed
niche
Topic-specific vocabulary (future paywall)
Seeded at launch, locked by is_locked flag


Flashcard Review Flow
Fetch all srs_cards WHERE user_id = current AND due_date <= now AND card_type = 'vocab'
Show cards one at a time — front side first (word + POS)
User flips to see back (translation, definition, source sentence, source text)
User rates: Again / Hard / Good / Easy
SRS engine updates ease_factor, interval, due_date, status
Continue until queue is empty

Progress Visualisation
Vocab progress on the dashboard displays as a pie chart or donut chart broken down by card status: New, Learning, Review, Mature. All data comes from a single GROUP BY query on srs_cards.

7. Grammar Section
Lesson Content Format
All lesson content is stored as structured JSON. A single reusable React component renders all lessons — adding a new lesson means writing JSON, not code. The explanation field is an array of typed content blocks:

{
  "id": "present-simple-positive",
  "title": "Present Simple — Positive Statements",
  "level": "A1",
  "category": "Tenses",
  "order": 3,
  "explanation": [
    { "type": "text", "content": "We use the present simple for habits..." },
    { "type": "example", "english": "She walks to work.", "translation": "Ona chodzi do pracy." },
    { "type": "rule", "content": "Add -s or -es for he/she/it" }
  ],
  "quiz": [
    {
      "id": "q1",
      "question": "Which sentence is correct?",
      "options": ["She walk.", "She walks.", "She walking.", "She is walk."],
      "correct": 1,
      "explanation": "Third person singular needs -s"
    }
  ]
}

Lesson Flow
Student opens a lesson — all lessons freely accessible, no locking
Reads explanation blocks (text, examples, rules) — scrollable, no time pressure
Optional: reads a companion comprehensible input text (tagged with grammar_lesson_id in texts table)
Takes the multiple choice quiz at the bottom
Score shown with explanations for incorrect answers
Each quiz question inserted into srs_cards as a grammar card (if not already present)
Grid cell for that lesson updates from grey to orange

Grammar SRS — Quiz as Flashcard
Grammar cards review exactly like they were originally taken — as a multiple choice question. The student sees the question and four options. After answering they rate difficulty. There is no blank flashcard format for grammar.

Content Creation Strategy
No grammar lessons are written yet. Recommended approach:
Write 5–10 A1 lessons manually first to finalise the JSON structure
Build the lesson renderer against these
Once structure is locked, use AI assistance to draft remaining lessons at scale
A1/A2 will have approximately 30–50 modules each. B1 upward progressively fewer

8. Grammar Progress Grid
The grammar progress grid (GrammarGrid.tsx) displays all grammar lessons as a compact grid of colour-coded cells. Each cell represents one lesson and is coloured by the student's SRS progress:

Colour States
- Grey (#D0D0D0) — Not attempted (no srs_card exists)
- Orange (#E8A850) — Learning (status: 'new' or 'learning')
- Green (#6BBF6B) — Mature (status: 'mature')

The grid reads live from srs_cards and renders accordingly. Clicking a cell navigates to the grammar lesson. The grid is shown on both the Grammar page and the Dashboard.

9. Dashboard
V1 Contents
The dashboard is the student's home screen. For V1 it displays:
Streak counter — days studied consecutively
Grammar progress grid — colour-coded overview of lesson status
Vocab progress — donut chart by card status (New / Learning / Review / Mature)
Cards due today — count of SRS reviews waiting across both Vocab and Grammar

Suggested next step, placement quiz, and onboarding tour are explicitly deferred to post-V1.

Dashboard Queries
All dashboard data comes from srs_cards. No separate progress tracking table is needed.

-- Cards due today (all types)
SELECT COUNT(*) FROM srs_cards
WHERE user_id = :uid AND due_date <= now()

-- Vocab progress by status
SELECT status, COUNT(*) FROM srs_cards
WHERE user_id = :uid AND card_type = 'vocab'
GROUP BY status

-- Grammar progress for grid
SELECT content_id, status FROM srs_cards
WHERE user_id = :uid AND card_type = 'grammar'

10. Onboarding — Deferred
Placement quiz and onboarding flow are explicitly out of scope for V1. When built, the placement quiz will:
Ask 15–20 multiple choice questions spanning A1 to B2
Set user.level based on score
Mark lower-level grammar cards as 'mature' automatically so students aren't flooded with beginner reviews
Stagger the auto-mature cards to avoid all becoming active at once

11. UI Style — Digital Stationery
Design Spec
Element
Spec
Background
#FDFBF7 — warm eggshell
Headings font
High-contrast serif (e.g. Georgia or Playfair Display)
Body / labels font
Spaced-out sans-serif (e.g. Inter or DM Sans with increased letter-spacing)
Navigation
Tabbed, styled like file folder tabs
Highlights / callouts
Highlighter-style boxes for important notes
Active state / underlines
Thin 1px border in muted terracotta
Interactive elements
Mimic physical office supplies aesthetic
Word highlight (selected)
Strong highlight on word, soft highlight on sentence and translation


12. Recommended Build Order
Build in this sequence. Each phase is independently usable and testable before the next begins.

Phase 1 — Foundation
Supabase project setup, auth, user table
Next.js project scaffold with Tailwind and Digital Stationery theme
Seed vocab_words with existing JSON data (restructured to new format)

Phase 2 — Input Section (Core Feature)
Text JSON format established and seeded with existing text
Bilingual reader with JS tokenisation and span generation
Phrasal verb detection in tokeniser
Word click → sidebar (desktop) / tooltip (mobile)
Sentence + translation highlighting
Polish toggle (hard mode)
Chapter index navigation
Read / Understand / Discuss tabs

Phase 3 — SRS Engine + Vocab
SM-2 algorithm implementation
srs_cards and srs_decks tables
Add to Flashcards from Input section
Premade deck seeded with common words
Flashcard review UI (vocab)
Vocab progress visualisation

Phase 4 — Grammar
Grammar lesson JSON format and first 5–10 A1 lessons written
Lesson renderer component
Quiz component
Grammar cards inserted into SRS on lesson completion
Grammar card review UI (multiple choice format)

Phase 5 — Grammar Grid + Dashboard
Grammar progress grid with live colour states
Dashboard: streak, grammar grid, vocab donut, due count

13. Explicitly Deferred (Post-V1)
Feature
Notes
Placement quiz / onboarding
Architecture defined in Section 10. Build after V1 is stable.
Suggested next step algorithm
Simple priority rules once SRS data exists
Free vs paid split / niche decks
is_locked flag already in schema. Implement when monetisation is ready.
Additional languages (French etc)
translations JSONB structure already supports this. Just add data.
Back-to-text link from flashcard
source_text_id and source_sentence already stored — link is trivial to add
Text-to-speech / audio
No current dependency. Can be added to texts table later.
AI feedback on Discuss answers
Static questions for V1. AI layer can wrap later.
Website explainer / how-to section
Deferred until grammar content exists


14. Key Decisions Summary
Decision
Chosen Approach
Stack
Next.js + Supabase + Tailwind
Auth
Supabase Auth
Word lookup
Hybrid: global dictionary + per-text context overrides
Phrasal verbs
Stored as vocab_words entries with trigger_words array; detected in tokeniser first pass
Multi-language
translations JSONB keyed by language_code on vocab_words and text_word_overrides
Text format
Plain JSON paragraphs/sentences; JS generates all spans at runtime
Mobile reading
Two independent swipeable containers synchronised by data-para / data-sentence attributes
SRS algorithm
SM-2, single shared implementation
SRS cards
One table for both vocab and grammar cards, differentiated by card_type
Flashcard source sentence
Exact sentence from the text, not premade examples
Flashcard definition
Context-specific override if available, global definition as fallback
Grammar lessons
Freely accessible, no locking
Grammar visualisation
Progress grid, live colour from srs_cards status
Lesson content
JSON-driven, single renderer component for all lessons


Input with Ease
Technical Implementation Supplement
This document is a companion to the main Architecture Brief. It fills in the technical decisions needed by Claude Code to build a working site without guessing. Hand both documents to Claude Code together.

1. Page Routes & File Structure
Use the Next.js App Router (app/ directory). Every route below is a folder inside app/ with a page.tsx file. All pages except the login/signup pages require authentication.

Route
Page
Auth Required
/
Redirects to /dashboard if logged in, otherwise /login
No
/login
Email + password login form
No
/signup
Registration form (email, password, native language picker)
No
/dashboard
Home screen: streak, grammar grid, vocab donut, due count
Yes
/input
Text library listing page with level filter
Yes
/input/[text-id]
Bilingual reader with Read / Understand / Discuss tabs
Yes
/vocab
Deck listing page showing all user decks + premade decks
Yes
/vocab/review
Flashcard review session (filters by deck via query param ?deck=id)
Yes
/grammar
Grammar section home: progress grid + lesson list grouped by level
Yes
/grammar/[lesson-id]
Lesson content + quiz at bottom
Yes
/grammar/review
Grammar card review session (multiple choice format)
Yes
/settings
Change native language, email, password
Yes


App Router File Layout
app/
  layout.tsx              // Root layout: wraps with AuthProvider + global nav
  page.tsx                // Root redirect logic
  (auth)/
    login/page.tsx
    signup/page.tsx
  (protected)/
    layout.tsx            // Auth guard + sidebar/nav wrapper
    dashboard/page.tsx
    input/
      page.tsx            // Text library
      [textId]/page.tsx   // Bilingual reader
    vocab/
      page.tsx            // Deck listing
      review/page.tsx     // Review session
    grammar/
      page.tsx            // Progress grid + lesson list
      [lessonId]/page.tsx // Lesson + quiz
      review/page.tsx     // Grammar review session
    settings/page.tsx

lib/
  supabase/
    client.ts             // Browser Supabase client
    server.ts             // Server-side Supabase client
    middleware.ts          // Auth middleware for protected routes
  srs.ts                  // SM-2 algorithm (pure function, ~30 lines)
  tokeniser.ts            // Word tokenisation + phrasal verb detection
  types.ts                // TypeScript interfaces for all DB tables

components/
  nav/Navbar.tsx           // Top navigation bar
  input/BilingualReader.tsx
  input/WordPanel.tsx
  vocab/Flashcard.tsx
  grammar/LessonRenderer.tsx
  grammar/QuizComponent.tsx
  grammar/GrammarGrid.tsx  // Colour-coded progress grid
  dashboard/StreakCounter.tsx
  dashboard/VocabDonut.tsx
  ui/                      // Shared UI primitives (buttons, cards, modals)


2. Authentication Flow
Method
Use Supabase Auth with email + password only for V1. No OAuth, no magic links. Keep it simple.
Signup Flow
User enters email, password, and selects native language from a dropdown (language codes: pl, fr, es, de, pt, it, tr, ar, zh, ja, ko, vi — expand later)
On successful signup, a row is inserted into the users table with language_code set, level set to null (no placement quiz in V1), and streak_days set to 0
User is redirected to /dashboard
Login Flow
Email + password form. On success, redirect to /dashboard
If login fails, show inline error message below the form
Logged-Out Experience
Everything is behind auth. Visiting any protected route while logged out redirects to /login. There is no public-facing content in V1.
Session Handling
Use Supabase’s built-in session management via @supabase/ssr. The middleware checks the session cookie on every request to a protected route. If the session is expired or missing, redirect to /login.

3. Data Access Pattern
Call Supabase directly from the client using the @supabase/supabase-js library. Do not create Next.js API routes. Use server components for initial data fetching where possible, and client-side calls for mutations and real-time updates.
Key Operations
Operation
Method
Where
Fetch text library
supabase.from('texts').select('id, title, level').order('level')
Server component
Fetch single text + translation
supabase.from('texts').select('*').eq('id', textId) + supabase.from('text_translations').select('*').eq('text_id', textId).eq('language_code', user.language_code)
Server component
Look up word on click
supabase.from('vocab_words').select('*').eq('id', wordId) + supabase.from('text_word_overrides').select('*').eq('text_id', textId).eq('word_id', wordId)
Client-side
Add flashcard
supabase.from('srs_cards').insert({...})
Client-side
Check if card already exists
supabase.from('srs_cards').select('id').eq('user_id', uid).eq('content_id', wordId).eq('source_text_id', textId)
Client-side
Fetch due cards for review
supabase.from('srs_cards').select('*, vocab_words(*), grammar_questions(*)').eq('user_id', uid).lte('due_date', now).eq('card_type', type)
Client-side
Update card after review
supabase.from('srs_cards').update({ease_factor, interval, due_date, status, repetitions, last_reviewed_at}).eq('id', cardId)
Client-side
Dashboard stats
Three queries: count due cards, group vocab by status, fetch grammar card statuses
Server component
Update streak
supabase.rpc('update_streak') — see Streak section
Client-side



4. Row Level Security Policies
Enable RLS on every table. Apply the following policies. These SQL statements should be run as part of the Supabase migration.

Table
SELECT
INSERT
UPDATE
DELETE
users
Own row only (auth.uid() = id)
Handled by Supabase Auth
Own row only
None
srs_cards
Own rows (user_id = auth.uid())
Own rows only
Own rows only
Own rows only
srs_decks
Own rows OR user_id IS NULL (premade)
Own rows only
Own rows only
Own rows only (custom only)
vocab_words
All authenticated users
None (admin seed only)
None
None
text_word_overrides
All authenticated users
None (admin seed only)
None
None
texts
All authenticated users
None (admin seed only)
None
None
text_translations
All authenticated users
None (admin seed only)
None
None
grammar_lessons
All authenticated users
None (admin seed only)
None
None
grammar_questions
All authenticated users
None (admin seed only)
None
None


For admin-seeded tables, insert data using the Supabase service role key in a seed script, which bypasses RLS.

5. Frontend State Management
Keep it simple. No external state library. Use these three patterns:
1. AuthContext (React Context)
A single context provider wrapping the entire app. Provides: user object (id, email, language_code, level, streak_days), loading state, signOut function. Lives in app/(protected)/layout.tsx.
2. Component-Level State (useState / useReducer)
The flashcard review session, quiz state, word panel data, and sentence highlighting are all local component state. Nothing about these needs to be global.
3. Server Components for Initial Data
Text library listings, lesson content, and dashboard stats are fetched in server components and passed as props. No client-side state needed for read-only data.


7. Business Logic Clarifications
Deck Assignment for “Add to Flashcards”
When a user first clicks “Add to Flashcards” from the Input section, check if they already have a custom deck called “My Words”. If not, create one automatically (deck_type: ‘custom’, user_id: current user, language_code: ‘en’). All words saved from reading go into this single deck. Users cannot create additional custom decks in V1.
Streak Logic
Timezone: UTC. A “day” is a UTC calendar day.
Activity that counts: completing at least one SRS review (rating any card Again/Hard/Good/Easy).
Streak update: implement as a Supabase database function (RPC). When called, it checks last_active_at. If last_active_at is yesterday (UTC), increment streak_days by 1. If last_active_at is today, do nothing. If last_active_at is older than yesterday, reset streak_days to 1. Then set last_active_at to now.
Call this function once at the start of any review session.
Polish Toggle (“Hard Mode”)
This is a toggle button on the bilingual reader that hides the translation column entirely. On desktop, the English text expands to full width. On mobile, the translation tab becomes empty with a message saying “Translation hidden — hard mode enabled.” The toggle is per-reading-session only, not persisted. Default is off (translation visible).
Grammar Quiz Completion Logic
When a user finishes a grammar lesson quiz, for each question: check if an srs_card already exists for that grammar_question. If not, insert a new card with card_type: ‘grammar’, content_id: question.id, status: ‘learning’, due_date: today, ease_factor: 2.5, interval: 1, repetitions: 0. The deck_id should point to a grammar deck that is auto-created per user (same pattern as the “My Words” vocab deck).

8. Navigation & Layout
Desktop (768px and above)
A horizontal top navigation bar with these tabs, styled like file folder tabs per the Digital Stationery theme: Dashboard, Input, Vocab, Grammar, Settings (right-aligned). The active tab has a slightly raised or highlighted appearance. Below the nav is the page content area.
Mobile (below 768px)
A fixed bottom tab bar with four icons: Dashboard (home icon), Input (book icon), Vocab (cards icon), Grammar (tree icon). Settings is accessible via a gear icon in the top-right corner of the Dashboard page. The active tab is highlighted with the terracotta accent colour.
Back Navigation
On sub-pages (e.g., /input/[text-id] or /grammar/[lesson-id]), show a back arrow in the top-left that returns to the parent listing page.

9. Loading, Empty, and Error States
Loading
Use skeleton loaders (grey pulsing rectangles matching the layout shape) for all data-dependent content. Never show a blank page. The grammar grid should show grey placeholder cells while loading.
Empty States (one message per context)
Context
Message
Dashboard: no cards due
“You’re all caught up! No reviews due today.”
Dashboard: no vocab cards at all
“Start reading to build your vocabulary. Go to Input to begin.” with a link
Text library: no texts at user level
Show all texts regardless, with level badges. No filtering removes content in V1
Vocab deck listing: no custom deck yet
“Words you save while reading will appear here.”
Flashcard review: queue empty
“No cards due right now. Come back later!” with a button back to /vocab
Grammar: no lessons attempted
All grid cells show grey. No special message needed — the grey state IS the empty state

Error States
If a Supabase query fails, show a simple inline error banner: “Something went wrong. Please try again.” with a retry button. Do not crash the page. Log the error to the browser console.


10. Text Library Page (/input)
Display texts as a grid of cards (2 columns desktop, 1 column mobile). Each card shows:
Title
CEFR level badge (colour-coded: A1/A2 green, B1/B2 blue, C1/C2 purple)
A short extract from the first sentence (first 80 characters, truncated with ellipsis)
Filtering
A row of clickable level filter pills at the top: All, A1, A2, B1, B2, C1, C2. Default is ‘All’. Clicking a level shows only texts at that level. No search bar in V1. No pagination — load all texts at once (the library will be small at launch).

11. Seed Data Instructions
Claude Code should generate placeholder seed data so the site is functional immediately after setup. Create a seed script at scripts/seed.ts that runs via npx ts-node scripts/seed.ts and uses the Supabase service role key.
Required seed data:
5 sample texts at varying levels (A1, A2, B1, B2, C1) with 3–5 paragraphs each, plus Polish translations. Content can be simple original passages about everyday topics
50 vocab_words entries covering common English words. Include translations for Polish (pl). Each word should have 1–2 example sentences
5 phrasal verb entries in vocab_words with trigger_words arrays
3–5 text_word_overrides entries demonstrating context-specific definitions
1 premade deck (“100 Most Common Words”) containing the first 50 vocab words as srs_cards
5 grammar lessons (all A1): Present Simple Positive, Present Simple Negative, Present Simple Questions, Articles, Plural Nouns. Each with 3–5 explanation blocks and 4–5 quiz questions
A complete grammar tree JSON file at lib/grammar-tree.ts that defines the full CEFR hierarchy (A1 through C2) with categories and lesson slugs. Lessons without content yet should still appear in the tree (they will render as grey cells on the grid and link to a “Lesson coming soon” placeholder page)

12. Environment & Deployment
Environment Variables (.env.local)
Variable
Description
NEXT_PUBLIC_SUPABASE_URL
Supabase project URL (public)
NEXT_PUBLIC_SUPABASE_ANON_KEY
Supabase anonymous/public key (public)
SUPABASE_SERVICE_ROLE_KEY
Service role key for seed scripts only (never exposed to browser)


Deployment
Deploy to Vercel. Connect the GitHub repository and Vercel will auto-detect Next.js. Add the environment variables in Vercel’s project settings. No other infrastructure is needed — Supabase handles the database, auth, and storage.
Node & Package Versions
Node.js: 18 or later
Next.js: 14 (App Router)
@supabase/supabase-js: latest
@supabase/ssr: latest
tailwindcss: latest
TypeScript: strict mode enabled

13. Supabase Database Setup
Generate a single SQL migration file at supabase/migrations/001_initial_schema.sql that creates all tables, enables RLS, and sets up policies. Here is the complete SQL that should be generated:
Important Notes for Claude Code:
Use the uuid_generate_v4() function for uuid primary keys (enable the uuid-ossp extension)
The users table should extend Supabase’s auth.users — create a public.users table with a foreign key to auth.users(id) and use a trigger to auto-create a public.users row on signup
Create the update_streak RPC function in this migration
All timestamp fields should default to now()
Create indexes on: srs_cards(user_id, due_date), srs_cards(user_id, card_type), texts(level)

14. Explicit Scope Boundaries for V1
To be absolutely clear, Claude Code should NOT build any of the following in V1:
Placement quiz or onboarding flow
Suggested next step algorithm
Payment, Stripe integration, or paywall logic
Multiple custom vocab decks (just the one auto-created “My Words” deck)
Text-to-speech or audio features
AI-powered discussion feedback
User-uploaded content or user-created texts
Admin panel (seed data manually via scripts)
Dark mode (single theme only)
Any language other than Polish for translations (the architecture supports it, but only seed Polish data)
Social features, leaderboards, or sharing
Email notifications or reminders

15. Minimum Testable Checklist
After building, Claude Code should verify the following works end-to-end:
Can sign up, log in, and be redirected to dashboard
Text library shows seeded texts with level badges
Clicking a text opens the bilingual reader with English and Polish side by side
Clicking a word opens the word panel with definition and translation
Clicking “Add to Flashcards” creates a card and shows “Added ✓”
Clicking the same word again shows “Already in your deck”
Vocab review session loads due cards, flips them, and accepts ratings
Rating a card updates its due_date (verifiable in Supabase dashboard)
Grammar lesson renders explanation blocks and quiz
Completing a quiz creates grammar srs_cards
Grammar grid renders with cells and correct colours based on card status
Dashboard shows streak, due count, and vocab donut chart
Navigation works on both desktop and mobile widths
