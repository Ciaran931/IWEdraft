#!/usr/bin/env python3
import os
import sys
import json
import re
import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm

# --------------------------
# Tokenization and JSON Setup
# --------------------------
def tokenize(text):
    """Split text into words (keep apostrophes) and punctuation"""
    return re.findall(r"\w+['’]?\w*|[^\w\s]", text)

def generate_word_json(tokens):
    """Create unique word list for words.json"""
    unique_words = set(token.lower() for token in tokens if re.match(r"\w+", token))
    word_list = []
    for word in sorted(unique_words):
        word_list.append({
            "id": word,
            "word": word,
            "pos": "",
            "pl_translation": "",
            "en_definition": "",
            "pl_definition": "",
            "example": ""
        })
    return word_list

def wrap_tokens_html(text):
    """
    Wraps words in <span> tags but preserves original spaces, newlines, and punctuation.
    """
    def repl(match):
        word = match.group(0)
        return f'<span class="word" data-id="{word.lower()}">{word}</span>'

    return re.sub(r"\w+['’]?\w*", repl, text)

# --------------------------
# DeepSeek AI Functions
# --------------------------
def ai_fill_word(word, api_key):
    """Get word definitions, translations, POS, and example from DeepSeek."""
    prompt = f"""Provide JSON for the English word '{word}' with the following fields:
- pos: part of speech (e.g., noun, verb, adjective, article)
- en_definition: concise English definition
- pl_definition: concise Polish definition
- pl_translation: Polish translation of the word
- example: one English example sentence using the word

Return only JSON like this:
{{"pos": "...", "en_definition": "...", "pl_definition": "...", "pl_translation": "...", "example": "..."}}"""

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a helpful assistant that only outputs JSON."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 200,
        "response_format": {"type": "json_object"}
    }

    try:
        response = requests.post("https://api.deepseek.com/chat/completions", headers=headers, json=data)
        response.raise_for_status()
        result_text = response.json()["choices"][0]["message"]["content"]
        return json.loads(result_text)
    except Exception as e:
        print(f"Error filling word '{word}': {e}")
        return {
            "pos": "",
            "en_definition": "",
            "pl_definition": "",
            "pl_translation": "",
            "example": ""
        }

def translate_paragraph_to_polish(paragraph, api_key):
    """Translate an English paragraph into Polish using DeepSeek."""
    prompt = f"Translate the following English paragraph into Polish, keeping paragraph and sentence structure:\n\n{paragraph}"

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "You are a translation assistant. Respond only with Polish text."},
            {"role": "user", "content": prompt}
        ],
        "max_tokens": 800
    }

    try:
        response = requests.post("https://api.deepseek.com/chat/completions", headers=headers, json=data)
        response.raise_for_status()
        return response.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        print(f"Error translating paragraph: {e}")
        return paragraph  # fallback to English if translation fails

# --------------------------
# Parallel AI fill for words
# --------------------------
def fill_words_parallel(words_json, api_key, max_workers=5):
    """Fills words in parallel using DeepSeek API with a progress bar."""
    def worker(word_entry):
        if not word_entry["en_definition"]:
            data = ai_fill_word(word_entry["word"], api_key)
            word_entry.update(data)
        return word_entry

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {executor.submit(worker, word): word for word in words_json}
        for f in tqdm(as_completed(futures), total=len(futures), desc="Filling words"):
            try:
                results.append(f.result())
            except Exception as e:
                word = futures[f]["word"]
                print(f"Error filling word '{word}': {e}")
    return results

# --------------------------
# Generate Bilingual HTML
# --------------------------
def generate_bilingual_html(en_text, pl_text):
    """Create HTML with aligned English and Polish paragraphs and global sentence numbers."""
    html = ['<div class="bilingual-container">']

    en_paragraphs = en_text.split("\n\n")
    pl_paragraphs = pl_text.split("\n\n")

    sentence_counter = 1  # Global sentence number

    for i, (en_para, pl_para) in enumerate(zip(en_paragraphs, pl_paragraphs), start=1):
        html.append(f'<div class="paragraph" data-paragraph="{i}">')

        # Wrap English words with spans
        en_para_wrapped = wrap_tokens_html(en_para)

        # Split into sentences
        en_sentences = re.split(r'(?<=[.!?])\s+', en_para_wrapped)
        pl_sentences = re.split(r'(?<=[.!?])\s+', pl_para)

        # English column
        html.append('<div class="english-column">')
        for en_sentence in en_sentences:
            html.append(f'<p class="english-sentence" data-sentence="{sentence_counter}">{en_sentence}</p>')
            sentence_counter += 1
        html.append('</div>')

        # Reset counter for Polish? No — use same global number
        sentence_counter_pl = sentence_counter - len(en_sentences)  # start same as English sentences
        html.append('<div class="polish-column">')
        for pl_sentence in pl_sentences:
            html.append(f'<p class="polish-sentence" data-sentence="{sentence_counter_pl}">{pl_sentence}</p>')
            sentence_counter_pl += 1
        html.append('</div>')

        html.append('</div>')  # paragraph

    html.append('</div>')  # bilingual-container
    return "\n".join(html)

# --------------------------
# Main Script
# --------------------------
def main():
    if len(sys.argv) != 2:
        print("Usage: python generate_story_snippet.py story.txt")
        sys.exit(1)

    input_file = sys.argv[1]
    api_key = os.getenv("DEESEEK_API_KEY")
    if not api_key:
        print("Error: Please set your DeepSeek API key in the environment variable DEESEEK_API_KEY")
        sys.exit(1)

    story_name = os.path.splitext(os.path.basename(input_file))[0]
    output_dir = os.path.join("input-pages", story_name)
    os.makedirs(output_dir, exist_ok=True)

    # Read English story
    with open(input_file, "r", encoding="utf-8") as f:
        en_text = f.read().strip()

    # --------------------------
    # Generate Polish translation
    print("Translating paragraphs to Polish...")
    en_paragraphs = en_text.split("\n\n")
    pl_paragraphs = [translate_paragraph_to_polish(p, api_key) for p in tqdm(en_paragraphs, desc="Translating")]
    pl_text = "\n\n".join(pl_paragraphs)

    # --------------------------
    # Tokenize and generate words.json
    tokens = tokenize(en_text)
    words_json = generate_word_json(tokens)

    # Autofill words with AI in parallel
    print("Filling word definitions via AI...")
    words_json = fill_words_parallel(words_json, api_key, max_workers=5)

    # Save words.json
    json_path = os.path.join(output_dir, "words.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(words_json, f, ensure_ascii=False, indent=2)

    # Generate bilingual HTML
    html_content = generate_bilingual_html(en_text, pl_text)
    snippet_path = os.path.join(output_dir, "story-bilingual.html")
    with open(snippet_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated words.json and bilingual HTML in {output_dir}/")

if __name__ == "__main__":
    main()
