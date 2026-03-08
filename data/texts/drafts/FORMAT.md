# Reading Text Draft Format

Place your English source text here as a plain text or markdown file.

## Input options

- Book chapters (public domain / copyright-free)
- YouTube transcripts
- Original passages on everyday topics
- News articles (copyright-free)

## Template

```
---
title: A Day at the Market
level: A2
category: graded
---

Sarah walked through the busy market on Saturday morning. She needed to buy vegetables for dinner.

"How much are the tomatoes?" she asked the vendor. He smiled and held up three fingers. "Three pounds per kilo," he said.

She picked up a bag of tomatoes and some fresh basil. The smell reminded her of her grandmother's kitchen. Every Sunday, her grandmother would make pasta sauce from scratch.

Sarah paid for her groceries and walked home, already planning tonight's meal.
```

## What Claude will do

1. Split the text into paragraphs and sentences (JSON format)
2. Generate the Polish translation file (aligned paragraph-by-paragraph)
3. Create word overrides for context-specific definitions if needed
4. Add comprehension questions (multiple choice) and discussion questions
5. Provide migration SQL or seed commands to insert the text into the database

## Notes

- Separate paragraphs with blank lines
- Keep sentences clear and natural
- Indicate the target CEFR level in the front matter
- Category is either "graded" (pedagogical) or "immersion" (authentic)
