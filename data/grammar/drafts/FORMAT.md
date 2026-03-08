# Grammar Lesson Draft Format

Create one file per lesson, named with the lesson slug (e.g., `past-simple-regular.md`).

## Template

```
---
title: Past Simple — Regular Verbs
level: A2
category: Tenses
order: 1
---

## Explanation

We use the past simple to talk about completed actions in the past.

## Example
English: She walked to the store yesterday.
Polish: Ona poszła wczoraj do sklepu.

## Example
English: They played football last weekend.
Polish: Grali w piłkę nożną w zeszły weekend.

## Rule
Add -ed to regular verbs: walk → walked, play → played.

## Rule
For verbs ending in -e, just add -d: live → lived.

## Quiz

Q: Which sentence is correct?
A: She walked to work.
B: She walk to work.
C: She walking to work.
D: She is walked to work.
Correct: A
Explanation: Regular past simple uses the -ed form.

Q: Choose the correct past simple form of "play".
A: played
B: plaied
C: playd
D: playing
Correct: A
Explanation: Regular verbs add -ed: play → played.
```

## Notes

- The `---` front matter block defines metadata (title, level, category, order)
- `## Explanation` blocks become `{ type: "text" }` content blocks
- `## Example` blocks become `{ type: "example" }` with English/Polish lines
- `## Rule` blocks become `{ type: "rule" }` content blocks
- `## Quiz` section contains questions with options A-D, correct answer, and explanation
- Claude will convert this to the JSON format used by `data/grammar/lessons.json`
