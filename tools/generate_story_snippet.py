#!/usr/bin/env python3
"""
Input with Ease — Text Processing Pipeline

Takes a plain .txt file of English text and generates all the JSON files
needed for the platform:

  1. {text-id}.json              — Source English text (paragraphs + sentences)
  2. {text-id}.pl.json           — Polish translation (sentence-aligned)
  3. {text-id}.words.json        — Vocab entries + phrasal verbs (with trigger_words)
  4. {text-id}.overrides.json    — text_word_overrides for context-specific meanings
  5. {text-id}.questions.json    — Comprehension + discussion questions

Usage:
    python generate_text_data.py story.txt --title "War of the Worlds" --level B1

Requirements:
    pip install requests tqdm

Environment:
    DEEPSEEK_API_KEY=your_key_here
"""

import os
import sys
import json
import re
import argparse
import time
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm


# ──────────────────────────────────────────────
# CONFIG
# ──────────────────────────────────────────────

API_URL = "https://api.deepseek.com/chat/completions"
MODEL = "deepseek-chat"
MAX_WORKERS = 5          # parallel API calls for word definitions
BATCH_SIZE = 20          # words per batch when filling definitions
MAX_RETRIES = 3          # retry failed API calls
RETRY_DELAY = 2          # seconds between retries


# ──────────────────────────────────────────────
# HELPERS
# ──────────────────────────────────────────────

def slugify(text):
    """Convert a title to a URL-friendly slug."""
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


def split_sentences(text):
    """Split a paragraph into sentences. Handles common abbreviations."""
    # Split on sentence-ending punctuation followed by space or end of string
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    return [s.strip() for s in sentences if s.strip()]


def extract_unique_words(paragraphs_data):
    """Extract all unique lowercase words from the text structure."""
    words = set()
    for para in paragraphs_data:
        for sentence in para["sentences"]:
            tokens = re.findall(r"\w+(?:['']\w+)?", sentence)
            for token in tokens:
                words.add(token.lower())
    return sorted(words)


def call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=2000):
    """Make a DeepSeek API call with retry logic."""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "max_tokens": max_tokens
    }
    if json_mode:
        data["response_format"] = {"type": "json_object"}

    for attempt in range(MAX_RETRIES):
        try:
            r = requests.post(API_URL, headers=headers, json=data, timeout=60)
            r.raise_for_status()
            content = r.json()["choices"][0]["message"]["content"]
            if json_mode:
                return json.loads(content)
            return content
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                print(f"  Retry {attempt + 1}/{MAX_RETRIES} after error: {e}")
                time.sleep(RETRY_DELAY * (attempt + 1))
            else:
                print(f"  Failed after {MAX_RETRIES} attempts: {e}")
                return None


# ──────────────────────────────────────────────
# PHRASAL VERB DETECTION
# ──────────────────────────────────────────────

# Master list of common English phrasal verbs.
# These are checked against each text during processing.
# Add more as needed — this covers the most frequent ~150.
COMMON_PHRASAL_VERBS = [
    "act up", "add up", "ask out",
    "back down", "back off", "back up", "blow out", "blow up", "break down",
    "break in", "break into", "break off", "break out", "break through",
    "break up", "bring about", "bring back", "bring down", "bring in",
    "bring out", "bring up", "brush up", "build up", "burn down", "burn out",
    "call back", "call off", "call on", "call up", "calm down", "carry on",
    "carry out", "catch on", "catch up", "check in", "check out", "cheer up",
    "clean up", "clear up", "close down", "come about", "come across",
    "come along", "come apart", "come back", "come down", "come in",
    "come off", "come on", "come out", "come over", "come round", "come up",
    "count on", "cross out", "cut back", "cut down", "cut off", "cut out",
    "cut up", "deal with", "do away with", "do up", "do without",
    "drag on", "draw up", "dress up", "drop by", "drop in", "drop off",
    "drop out", "eat out", "end up", "fall apart", "fall behind",
    "fall down", "fall for", "fall off", "fall out", "fall through",
    "figure out", "fill in", "fill out", "fill up", "find out", "fit in",
    "fix up", "get across", "get ahead", "get along", "get around",
    "get away", "get back", "get by", "get down", "get in", "get into",
    "get off", "get on", "get out", "get over", "get through", "get together",
    "get up", "give away", "give back", "give in", "give out", "give up",
    "go about", "go after", "go ahead", "go along", "go away", "go back",
    "go down", "go for", "go in", "go off", "go on", "go out", "go over",
    "go through", "go up", "grow up", "hand in", "hand out", "hand over",
    "hang around", "hang on", "hang out", "hang up", "head for", "hold back",
    "hold on", "hold up", "hurry up", "keep away", "keep on", "keep up",
    "knock down", "knock out", "lay off", "leave out", "let down", "let in",
    "let off", "lie down", "line up", "lock up", "look after", "look ahead",
    "look around", "look back", "look down", "look for", "look forward to",
    "look into", "look out", "look over", "look up", "make out", "make up",
    "mix up", "move in", "move on", "move out", "own up", "pass away",
    "pass by", "pass on", "pass out", "pay back", "pay off", "pick out",
    "pick up", "point out", "pull apart", "pull down", "pull in", "pull off",
    "pull out", "pull over", "pull through", "pull up", "push on",
    "put aside", "put away", "put back", "put down", "put forward",
    "put in", "put off", "put on", "put out", "put through", "put together",
    "put up", "put up with", "ring up", "rip off", "rule out", "run across",
    "run away", "run down", "run into", "run off", "run out", "run over",
    "sell out", "send back", "set off", "set out", "set up", "settle down",
    "show off", "show up", "shut down", "shut up", "sign in", "sign out",
    "sign up", "sit down", "slow down", "sort out", "speak up", "speed up",
    "stand by", "stand for", "stand out", "stand up", "stay up", "step down",
    "stick out", "stick to", "stick up", "sum up", "switch off", "switch on",
    "take after", "take apart", "take away", "take back", "take down",
    "take in", "take off", "take on", "take out", "take over", "take up",
    "talk over", "tear down", "tear up", "tell off", "think over",
    "throw away", "throw out", "throw up", "tidy up", "try on", "try out",
    "turn around", "turn back", "turn down", "turn in", "turn into",
    "turn off", "turn on", "turn out", "turn over", "turn up", "use up",
    "wait on", "wake up", "warm up", "wash up", "watch out", "wear off",
    "wear out", "work out", "wrap up", "write down", "write up",
]


def detect_phrasal_verbs_in_text(paragraphs_data):
    """
    Scan the text for phrasal verbs from the master list.
    Returns a list of phrasal verb strings that actually appear in this text.

    Handles cases where the verb and particle may be separated by a few words
    (e.g. "She gave the job up" matches "give up") by also checking for the
    base forms of the verb (simple stemming for common patterns).
    """
    # Build the full text as lowercase for scanning
    full_text = ""
    for para in paragraphs_data:
        for sentence in para["sentences"]:
            full_text += " " + sentence.lower()

    found = []
    for pv in COMMON_PHRASAL_VERBS:
        parts = pv.split()
        # Check for the exact phrase (most common case)
        # Use word boundary matching to avoid partial matches
        pattern = r"\b" + r"\s+".join(re.escape(p) for p in parts) + r"\b"
        if re.search(pattern, full_text):
            found.append(pv)
            continue

        # Also check common verb conjugations (e.g. "gives up", "gave up",
        # "giving up", "broken down", "looked up")
        # Simple approach: check if the verb stem appears near the particle
        verb = parts[0]
        particle = " ".join(parts[1:])  # handles 3-word phrasal verbs like "put up with"

        # Common conjugation endings
        conjugations = [
            verb + "s",       # gives
            verb + "ed",      # looked
            verb + "ing",     # looking
            verb + "d",       # shared
        ]
        # Handle double consonant (e.g. drop -> dropped, dropping)
        if len(verb) > 2 and verb[-1] not in "aeiouy" and verb[-2] in "aeiou":
            conjugations.append(verb + verb[-1] + "ed")    # dropped
            conjugations.append(verb + verb[-1] + "ing")   # dropping
        # Handle -e ending (e.g. give -> gave is irregular, but give -> giving)
        if verb.endswith("e"):
            conjugations.append(verb[:-1] + "ing")  # giving
            conjugations.append(verb[:-1] + "ed")   # (for regular -e verbs)

        for conj in conjugations:
            pattern = r"\b" + re.escape(conj) + r"\s+" + re.escape(particle) + r"\b"
            if re.search(pattern, full_text):
                found.append(pv)
                break

    return found


def fill_phrasal_verb_definitions(phrasal_verbs, api_key):
    """
    Get definitions for detected phrasal verbs via DeepSeek.
    Returns vocab_words-format entries with trigger_words set.
    """
    if not phrasal_verbs:
        return []

    pv_list = ", ".join(f'"{pv}"' for pv in phrasal_verbs)

    system_prompt = (
        "You are an English dictionary API specialising in phrasal verbs. "
        "For each phrasal verb, provide its data. "
        "Return a JSON object where each key is the phrasal verb (lowercase) and the value is an object with:\n"
        '  "pos": always "phrasal_verb"\n'
        '  "en_definition": clear English definition (1-2 sentences)\n'
        '  "pl_translation": the most common Polish translation\n'
        '  "pl_definition": Polish definition (1-2 sentences)\n'
        '  "examples": array of 2-3 short example sentences\n'
        "\nReturn ONLY the JSON object."
    )

    user_prompt = f"Provide dictionary data for these phrasal verbs: {pv_list}"

    result = call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=4000)

    entries = []
    if result:
        for pv in phrasal_verbs:
            pv_data = result.get(pv, {})
            entries.append({
                "id": slugify(pv),
                "word": pv,
                "pos": "phrasal_verb",
                "en_definition": pv_data.get("en_definition", ""),
                "examples": pv_data.get("examples", []),
                "trigger_words": pv.split(),
                "translations": {
                    "pl": {
                        "word": pv_data.get("pl_translation", ""),
                        "definition": pv_data.get("pl_definition", "")
                    }
                }
            })
    else:
        # Fallback: create entries without definitions
        for pv in phrasal_verbs:
            entries.append({
                "id": slugify(pv),
                "word": pv,
                "pos": "phrasal_verb",
                "en_definition": "",
                "examples": [],
                "trigger_words": pv.split(),
                "translations": {
                    "pl": { "word": "", "definition": "" }
                }
            })

    return entries


# ──────────────────────────────────────────────
# STEP 1: BUILD SOURCE TEXT JSON
# ──────────────────────────────────────────────

def build_text_json(text_id, title, level, raw_text, grammar_lesson_id=None, category="graded"):
    """
    Convert raw English text into the platform's text JSON format.

    Output format:
    {
        "id": "war-of-the-worlds",
        "title": "War of the Worlds",
        "level": "B1",
        "category": "graded",
        "grammar_lesson_id": null,
        "paragraphs": [
            { "id": 1, "sentences": ["Sentence one.", "Sentence two."] }
        ]
    }
    """
    raw_paragraphs = [p.strip() for p in raw_text.split("\n\n") if p.strip()]

    paragraphs = []
    for i, para_text in enumerate(raw_paragraphs, start=1):
        sentences = split_sentences(para_text)
        paragraphs.append({
            "id": i,
            "sentences": sentences
        })

    return {
        "id": text_id,
        "title": title,
        "level": level,
        "category": category,
        "grammar_lesson_id": grammar_lesson_id,
        "paragraphs": paragraphs
    }


# ──────────────────────────────────────────────
# STEP 2: TRANSLATE TO POLISH (SENTENCE-ALIGNED)
# ──────────────────────────────────────────────

def translate_text(text_data, api_key):
    """
    Translate each paragraph sentence-by-sentence to maintain alignment.

    Output format:
    {
        "text_id": "war-of-the-worlds",
        "language_code": "pl",
        "paragraphs": [
            { "id": 1, "sentences": ["Polish sentence one.", "Polish sentence two."] }
        ]
    }
    """
    print("\n📝 Translating paragraphs to Polish...")

    translated_paragraphs = []

    for para in tqdm(text_data["paragraphs"], desc="Translating"):
        # Send all sentences in a paragraph together for better context,
        # but ask for them to be returned individually
        sentences_numbered = "\n".join(
            f"{i+1}. {s}" for i, s in enumerate(para["sentences"])
        )

        system_prompt = (
            "You are a professional English-to-Polish translator. "
            "Translate each numbered sentence below into Polish. "
            "Return a JSON object with a single key 'sentences' containing "
            "an array of translated strings in the same order. "
            "Keep the same number of sentences. Do not add or remove sentences."
        )

        user_prompt = f"Translate these sentences to Polish:\n\n{sentences_numbered}"

        result = call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=2000)

        if result and "sentences" in result:
            pl_sentences = result["sentences"]
            # Ensure we have the right number of sentences
            if len(pl_sentences) != len(para["sentences"]):
                print(f"  ⚠ Paragraph {para['id']}: expected {len(para['sentences'])} sentences, got {len(pl_sentences)}. Padding/trimming.")
                while len(pl_sentences) < len(para["sentences"]):
                    pl_sentences.append("[Translation missing]")
                pl_sentences = pl_sentences[:len(para["sentences"])]
        else:
            print(f"  ⚠ Paragraph {para['id']}: translation failed, using placeholders")
            pl_sentences = ["[Translation failed]"] * len(para["sentences"])

        translated_paragraphs.append({
            "id": para["id"],
            "sentences": pl_sentences
        })

    return {
        "text_id": text_data["id"],
        "language_code": "pl",
        "paragraphs": translated_paragraphs
    }


# ──────────────────────────────────────────────
# STEP 3: GENERATE VOCAB WORDS
# ──────────────────────────────────────────────

def fill_word_batch(words_batch, api_key):
    """
    Fill definitions for a batch of words in a single API call.
    More efficient than one-word-at-a-time.
    """
    word_list = ", ".join(f'"{w}"' for w in words_batch)

    system_prompt = (
        "You are an English dictionary API. For each word, provide its data. "
        "Return a JSON object where each key is the word (lowercase) and the value is an object with:\n"
        '  "pos": part of speech (noun, verb, adjective, adverb, phrasal_verb, preposition, conjunction, determiner, pronoun, interjection)\n'
        '  "en_definition": clear English definition (1-2 sentences)\n'
        '  "pl_translation": the most common Polish translation (single word or short phrase)\n'
        '  "pl_definition": Polish definition (1-2 sentences)\n'
        '  "examples": array of 2-3 short example sentences in English\n'
        '  "is_phrasal_verb": boolean, true only if this is a phrasal verb\n'
        '  "trigger_words": if is_phrasal_verb is true, array of the component words (e.g. ["give", "up"]), otherwise null\n'
        "\nFor very common function words (the, a, is, to, of, etc), still provide accurate data. "
        "Return ONLY the JSON object."
    )

    user_prompt = f"Provide dictionary data for these English words: {word_list}"

    result = call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=4000)
    return result


def generate_vocab_words(unique_words, api_key):
    """
    Generate vocab_words entries for all unique words in the text.

    Output format per word:
    {
        "id": "rock",
        "word": "rock",
        "pos": "noun",
        "en_definition": "A solid mineral material forming part of the earth.",
        "examples": ["The rock was covered in moss.", "She sat on a large rock."],
        "trigger_words": null,
        "translations": {
            "pl": {
                "word": "skała",
                "definition": "Twarda mineralna substancja tworząca część skorupy ziemskiej."
            }
        }
    }
    """
    print(f"\n📖 Generating definitions for {len(unique_words)} unique words...")

    vocab_entries = {}

    # Process in batches
    batches = [unique_words[i:i+BATCH_SIZE] for i in range(0, len(unique_words), BATCH_SIZE)]

    for batch in tqdm(batches, desc="Word batches"):
        result = fill_word_batch(batch, api_key)

        if not result:
            # Create empty entries for failed batch
            for word in batch:
                vocab_entries[word] = make_empty_vocab(word)
            continue

        for word in batch:
            # The AI might return the word with different casing
            word_data = result.get(word) or result.get(word.lower()) or result.get(word.capitalize())

            if word_data:
                vocab_entries[word] = {
                    "id": slugify(word),
                    "word": word,
                    "pos": word_data.get("pos", ""),
                    "en_definition": word_data.get("en_definition", ""),
                    "examples": word_data.get("examples", []),
                    "trigger_words": word_data.get("trigger_words") if word_data.get("is_phrasal_verb") else None,
                    "translations": {
                        "pl": {
                            "word": word_data.get("pl_translation", ""),
                            "definition": word_data.get("pl_definition", "")
                        }
                    }
                }
            else:
                vocab_entries[word] = make_empty_vocab(word)

    return list(vocab_entries.values())


def make_empty_vocab(word):
    """Create a placeholder vocab entry for words that failed AI lookup."""
    return {
        "id": slugify(word),
        "word": word,
        "pos": "",
        "en_definition": "",
        "examples": [],
        "trigger_words": None,
        "translations": {
            "pl": {
                "word": "",
                "definition": ""
            }
        }
    }


# ──────────────────────────────────────────────
# STEP 4: DETECT CONTEXT-SPECIFIC OVERRIDES
# ──────────────────────────────────────────────

def detect_overrides(text_data, vocab_words, api_key):
    """
    Ask the AI to identify words in this text that have unusual or
    context-specific meanings that differ from their default definition.

    Output format:
    [
        {
            "text_id": "war-of-the-worlds",
            "word_id": "run",
            "en_definition": "To manage or operate (a business)",
            "translations": {
                "pl": {
                    "word": "prowadzić",
                    "definition": "Zarządzać lub kierować (firmą)"
                }
            }
        }
    ]
    """
    print("\n🔍 Detecting context-specific word meanings...")

    # Build a compact version of the text for the prompt
    full_text = ""
    for para in text_data["paragraphs"]:
        full_text += " ".join(para["sentences"]) + "\n\n"

    # Build a quick lookup of default definitions
    word_defs = {v["word"]: v["en_definition"] for v in vocab_words if v["en_definition"]}

    system_prompt = (
        "You are a linguist analysing an English text for language learners. "
        "I will give you a text and a list of words with their default definitions. "
        "Identify any words in the text where the meaning used is SIGNIFICANTLY different "
        "from the default definition provided. Only flag genuinely different meanings — "
        "not minor nuances.\n\n"
        "For each flagged word, return:\n"
        '  "word_id": the word (lowercase)\n'
        '  "en_definition": the context-specific English definition\n'
        '  "pl_translation": context-specific Polish translation\n'
        '  "pl_definition": context-specific Polish definition\n\n'
        'Return a JSON object with key "overrides" containing an array of these objects. '
        "If no words need overrides, return {\"overrides\": []}."
    )

    # Only send a sample of word definitions to stay within token limits
    sample_defs = dict(list(word_defs.items())[:200])
    defs_text = "\n".join(f"  {w}: {d}" for w, d in sample_defs.items())

    user_prompt = f"TEXT:\n{full_text[:3000]}\n\nDEFAULT DEFINITIONS:\n{defs_text}"

    result = call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=2000)

    overrides = []
    if result and "overrides" in result:
        for o in result["overrides"]:
            overrides.append({
                "text_id": text_data["id"],
                "word_id": slugify(o.get("word_id", "")),
                "en_definition": o.get("en_definition", ""),
                "translations": {
                    "pl": {
                        "word": o.get("pl_translation", ""),
                        "definition": o.get("pl_definition", "")
                    }
                }
            })

    print(f"  Found {len(overrides)} context-specific overrides")
    return overrides


# ──────────────────────────────────────────────
# STEP 5: GENERATE COMPREHENSION QUESTIONS
# ──────────────────────────────────────────────

def generate_comprehension_questions(text_data, api_key):
    """
    Generate 'Understand' tab questions for the text.

    Output format:
    [
        {
            "question": "Why did the narrator go to the harbour?",
            "options": ["To buy fish", "To watch the boats", "To meet a friend", "To swim"],
            "correct_index": 1,
            "explanation": "The text states that he went to watch the grey boats."
        }
    ]
    """
    print("\n❓ Generating comprehension questions...")

    full_text = ""
    for para in text_data["paragraphs"]:
        full_text += " ".join(para["sentences"]) + "\n\n"

    system_prompt = (
        "You are creating reading comprehension questions for English language learners. "
        "Based on the text provided, create 5 multiple-choice questions that test understanding. "
        "Each question should have 4 options with exactly one correct answer.\n\n"
        "Return a JSON object with key 'questions' containing an array of objects with:\n"
        '  "question": the question text\n'
        '  "options": array of 4 answer strings\n'
        '  "correct_index": 0-based index of the correct option\n'
        '  "explanation": brief explanation of why the answer is correct\n'
    )

    user_prompt = f"Create comprehension questions for this text:\n\n{full_text[:4000]}"

    result = call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=2000)

    if result and "questions" in result:
        return result["questions"]
    return []


# ──────────────────────────────────────────────
# STEP 6: GENERATE DISCUSSION QUESTIONS
# ──────────────────────────────────────────────

def generate_discussion_questions(text_data, api_key):
    """
    Generate 'Discuss' tab questions for the text.
    These are open-ended, no answers needed.
    """
    print("\n💬 Generating discussion questions...")

    full_text = ""
    for para in text_data["paragraphs"]:
        full_text += " ".join(para["sentences"]) + "\n\n"

    system_prompt = (
        "You are creating discussion questions for English language learners. "
        "Based on the text, create 3-5 open-ended discussion questions that encourage "
        "the learner to think about the themes, relate the content to their own life, "
        "or express opinions. Questions should be appropriate for the text's CEFR level.\n\n"
        "Return a JSON object with key 'questions' containing an array of strings."
    )

    user_prompt = f"Create discussion questions for this {text_data['level']}-level text:\n\n{full_text[:4000]}"

    result = call_deepseek(api_key, system_prompt, user_prompt, json_mode=True, max_tokens=1000)

    if result and "questions" in result:
        return result["questions"]
    return []


# ──────────────────────────────────────────────
# MAIN PIPELINE
# ──────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Input with Ease — Text Processing Pipeline",
        epilog="Example: python generate_text_data.py story.txt --title 'War of the Worlds' --level B1"
    )
    parser.add_argument("input_file", help="Path to the .txt file containing English text (paragraphs separated by blank lines)")
    parser.add_argument("--title", required=True, help="Display title of the text")
    parser.add_argument("--level", required=True, choices=["A1", "A2", "B1", "B2", "C1", "C2", "Native"], help="CEFR level or 'Native' for immersion content")
    parser.add_argument("--category", default="graded", choices=["graded", "immersion"], help="Content category (default: graded)")
    parser.add_argument("--grammar-lesson", default=None, help="Optional grammar_lesson_id to link to")
    parser.add_argument("--output-dir", default="./data/texts", help="Output directory (default: ./data/texts)")
    parser.add_argument("--skip-overrides", action="store_true", help="Skip context-specific override detection")
    parser.add_argument("--skip-questions", action="store_true", help="Skip comprehension + discussion question generation")

    args = parser.parse_args()

    # Check API key
    api_key = os.getenv("DEEPSEEK_API_KEY")
    if not api_key:
        print("❌ Error: Set your DeepSeek API key in the DEEPSEEK_API_KEY environment variable")
        print("   export DEEPSEEK_API_KEY=your_key_here")
        sys.exit(1)

    # Read input
    with open(args.input_file, "r", encoding="utf-8") as f:
        raw_text = f.read().strip()

    text_id = slugify(args.title)
    output_dir = os.path.join(args.output_dir, text_id)
    os.makedirs(output_dir, exist_ok=True)

    print(f"═══════════════════════════════════════════")
    print(f"  Input with Ease — Text Pipeline")
    print(f"  Text: {args.title}")
    print(f"  ID:   {text_id}")
    print(f"  Level: {args.level}")
    print(f"═══════════════════════════════════════════")

    # ── STEP 1: Source text JSON ──
    print("\n📄 Building source text JSON...")
    text_data = build_text_json(text_id, args.title, args.level, raw_text, args.grammar_lesson, args.category)
    text_path = os.path.join(output_dir, f"{text_id}.json")
    with open(text_path, "w", encoding="utf-8") as f:
        json.dump(text_data, f, ensure_ascii=False, indent=2)
    print(f"  ✓ Saved {text_path}")
    para_count = len(text_data["paragraphs"])
    sentence_count = sum(len(p["sentences"]) for p in text_data["paragraphs"])
    print(f"  {para_count} paragraphs, {sentence_count} sentences")

    # ── STEP 2: Polish translation ──
    translation_path = os.path.join(output_dir, f"{text_id}.pl.json")
    if os.path.exists(translation_path):
        print(f"\n📝 Translation already exists at {translation_path}, skipping.")
        with open(translation_path, "r", encoding="utf-8") as f:
            translation_data = json.load(f)
    else:
        translation_data = translate_text(text_data, api_key)
        with open(translation_path, "w", encoding="utf-8") as f:
            json.dump(translation_data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Saved {translation_path}")

    # ── STEP 3: Phrasal verb detection + Vocab words ──
    words_path = os.path.join(output_dir, f"{text_id}.words.json")
    if os.path.exists(words_path):
        print(f"\n📖 Words already exist at {words_path}, skipping.")
        with open(words_path, "r", encoding="utf-8") as f:
            vocab_words = json.load(f)
    else:
        # 3a: Detect phrasal verbs first
        print("\n🔗 Scanning for phrasal verbs...")
        found_pvs = detect_phrasal_verbs_in_text(text_data["paragraphs"])
        print(f"  Found {len(found_pvs)} phrasal verbs: {', '.join(found_pvs) if found_pvs else 'none'}")

        pv_entries = []
        if found_pvs:
            print("  Fetching phrasal verb definitions...")
            pv_entries = fill_phrasal_verb_definitions(found_pvs, api_key)

        # 3b: Generate individual word definitions
        unique_words = extract_unique_words(text_data["paragraphs"])
        print(f"\n📖 Generating definitions for {len(unique_words)} unique words...")
        vocab_words = generate_vocab_words(unique_words, api_key)

        # 3c: Merge phrasal verbs into the vocab list
        # Phrasal verbs go at the front so the frontend can load them first
        vocab_words = pv_entries + vocab_words

        with open(words_path, "w", encoding="utf-8") as f:
            json.dump(vocab_words, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Saved {words_path} ({len(pv_entries)} phrasal verbs + {len(vocab_words) - len(pv_entries)} words)")

    # ── STEP 4: Context overrides ──
    if not args.skip_overrides:
        overrides_path = os.path.join(output_dir, f"{text_id}.overrides.json")
        if os.path.exists(overrides_path):
            print(f"\n🔍 Overrides already exist at {overrides_path}, skipping.")
        else:
            overrides = detect_overrides(text_data, vocab_words, api_key)
            with open(overrides_path, "w", encoding="utf-8") as f:
                json.dump(overrides, f, ensure_ascii=False, indent=2)
            print(f"  ✓ Saved {overrides_path}")

    # ── STEP 5: Comprehension questions ──
    if not args.skip_questions:
        questions_path = os.path.join(output_dir, f"{text_id}.questions.json")
        if os.path.exists(questions_path):
            print(f"\n❓ Questions already exist at {questions_path}, skipping.")
        else:
            questions = generate_comprehension_questions(text_data, api_key)
            discussion = generate_discussion_questions(text_data, api_key)
            questions_data = {
                "text_id": text_id,
                "comprehension": questions,
                "discussion": discussion
            }
            with open(questions_path, "w", encoding="utf-8") as f:
                json.dump(questions_data, f, ensure_ascii=False, indent=2)
            print(f"  ✓ Saved {questions_path}")

    # ── SUMMARY ──
    print(f"\n═══════════════════════════════════════════")
    print(f"  ✅ All done! Output in: {output_dir}/")
    print(f"")
    print(f"  Files generated:")
    print(f"    {text_id}.json              — Source English text")
    print(f"    {text_id}.pl.json           — Polish translation")
    print(f"    {text_id}.words.json        — Vocab entries + phrasal verbs")
    if not args.skip_overrides:
        print(f"    {text_id}.overrides.json    — Context-specific definitions")
    if not args.skip_questions:
        print(f"    {text_id}.questions.json    — Comprehension + discussion questions")
    print(f"")
    print(f"  Next step:")
    print(f"    Use the Supabase seed script to import these files")
    print(f"    into the database, or place them in the app's data folder.")
    print(f"═══════════════════════════════════════════")


if __name__ == "__main__":
    main()