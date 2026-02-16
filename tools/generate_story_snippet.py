#!/usr/bin/env python3

import os
import sys
import json
import re
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from bs4 import BeautifulSoup, NavigableString

# --------------------------
# Tokenization
# --------------------------

def tokenize(text):
    return re.findall(r"\w+['’]?\w*", text)

def generate_word_json(tokens):
    unique_words = sorted(set(word.lower() for word in tokens))
    return [
        {
            "id": word,
            "word": word,
            "pos": "",
            "pl_translation": "",
            "en_definition": "",
            "pl_definition": "",
            "example": []
        }
        for word in unique_words
    ]

# --------------------------
# SAFE HTML WORD WRAPPING
# --------------------------

def wrap_tokens_html(text):
    soup = BeautifulSoup(text, "html.parser")
    for node in soup.find_all(string=True):
        if isinstance(node, NavigableString):
            new_html = re.sub(
                r"\w+['’]?\w*",
                lambda m: f'<span class="word" data-id="{m.group(0).lower()}">{m.group(0)}</span>',
                str(node)
            )
            node.replace_with(BeautifulSoup(new_html, "html.parser"))
    return str(soup)

# --------------------------
# AI WORD DATA
# --------------------------

def ai_fill_word(word, api_key):
    prompt = f"""
Provide JSON for the English word '{word}':

pos,
en_definition,
pl_definition,
pl_translation,
examples (3 short sentences)

Return JSON only.
"""
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Return JSON only."},
            {"role": "user", "content": prompt}
        ],
        "response_format": {"type": "json_object"},
        "max_tokens": 300
    }

    try:
        r = requests.post("https://api.deepseek.com/chat/completions", headers=headers, json=data)
        result = r.json()["choices"][0]["message"]["content"]
        return json.loads(result)
    except Exception as e:
        print("AI error:", word, e)
        return {
            "pos": "",
            "en_definition": "",
            "pl_definition": "",
            "pl_translation": "",
            "example": []
        }

# --------------------------
# PARALLEL WORD FILL
# --------------------------

def fill_words_parallel(words, api_key):
    def worker(entry):
        data = ai_fill_word(entry["word"], api_key)
        entry.update(data)
        return entry

    results = []
    with ThreadPoolExecutor(max_workers=5) as exe:
        futures = [exe.submit(worker, w) for w in words]
        for f in tqdm(as_completed(futures), total=len(futures), desc="Filling words"):
            results.append(f.result())
    return results

# --------------------------
# TRANSLATION
# --------------------------

def translate_paragraph(paragraph, api_key):
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    data = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": "Translate to Polish."},
            {"role": "user", "content": paragraph}
        ],
        "max_tokens": 1000
    }
    try:
        r = requests.post("https://api.deepseek.com/chat/completions", headers=headers, json=data)
        return r.json()["choices"][0]["message"]["content"]
    except:
        return paragraph

# --------------------------
# SENTENCE SPLIT
# --------------------------

def split_sentences(text):
    return re.split(r'(?<=[.!?])\s+', text.strip())

# --------------------------
# HTML GENERATION
# --------------------------

def generate_bilingual_html(en_text, pl_text):
    html = ['<div class="bilingual-container">']
    en_paragraphs = en_text.split("\n\n")
    pl_paragraphs = pl_text.split("\n\n")
    sentence_id = 1

    for i in range(len(en_paragraphs)):
        html.append(f'<div class="paragraph" data-paragraph="{i+1}">')

        en_sentences = split_sentences(en_paragraphs[i])
        pl_sentences = split_sentences(pl_paragraphs[i])

        # English column
        html.append('<div class="english-column">')
        for s in en_sentences:
            wrapped = wrap_tokens_html(s)
            html.append(f'<div class="english-sentence" data-sentence="{sentence_id}">{wrapped}</div>')
            sentence_id += 1
        html.append('</div>')

        # Polish column
        html.append('<div class="polish-column">')
        pl_id = sentence_id - len(en_sentences)
        for s in pl_sentences:
            html.append(f'<div class="polish-sentence" data-sentence="{pl_id}">{s}</div>')
            pl_id += 1
        html.append('</div>')

        html.append('</div>')  # paragraph

    html.append('</div>')  # bilingual-container
    return "\n".join(html)

# --------------------------
# MAIN
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
    pl_paragraphs = [translate_paragraph(p, api_key) for p in tqdm(en_paragraphs, desc="Translating")]
    pl_text = "\n\n".join(pl_paragraphs)

    # --------------------------
    # Tokenize and generate words.json if not exists
    words_json_path = os.path.join(output_dir, "words.json")
    if os.path.exists(words_json_path):
        print(f"words.json already exists at {words_json_path}, skipping AI word fill.")
        with open(words_json_path, "r", encoding="utf-8") as f:
            words = json.load(f)
    else:
        print("Tokenizing...")
        tokens = tokenize(en_text)
        words = generate_word_json(tokens)

        print("Filling word definitions via AI...")
        words = fill_words_parallel(words, api_key)

        print("Saving words.json...")
        with open(words_json_path, "w", encoding="utf-8") as f:
            json.dump(words, f, ensure_ascii=False, indent=2)

    # --------------------------
    # Generate bilingual HTML
    print("Generating bilingual HTML...")
    html_content = generate_bilingual_html(en_text, pl_text)
    snippet_path = os.path.join(output_dir, "story-bilingual.html")
    with open(snippet_path, "w", encoding="utf-8") as f:
        f.write(html_content)

    print(f"Generated words.json and bilingual HTML in {output_dir}/")

if __name__ == "__main__":
    main()
