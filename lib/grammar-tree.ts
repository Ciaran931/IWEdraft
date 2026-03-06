import type { GrammarTreeLevel } from './types'

export const GRAMMAR_TREE: GrammarTreeLevel[] = [
  {
    level: 'A1',
    children: [
      {
        type: 'category',
        label: 'Tenses',
        children: [
          { type: 'leaf', id: 'present-simple-positive', label: 'Present Simple — Positive' },
          { type: 'leaf', id: 'present-simple-negative', label: 'Present Simple — Negative' },
          { type: 'leaf', id: 'present-simple-questions', label: 'Present Simple — Questions' },
        ],
      },
      {
        type: 'category',
        label: 'Nouns',
        children: [
          { type: 'leaf', id: 'articles', label: 'Articles (a / an / the)' },
          { type: 'leaf', id: 'plural-nouns', label: 'Plural Nouns' },
        ],
      },
    ],
  },
  {
    level: 'A2',
    children: [
      {
        type: 'category',
        label: 'Tenses',
        children: [
          { type: 'leaf', id: 'past-simple-regular', label: 'Past Simple — Regular' },
          { type: 'leaf', id: 'past-simple-irregular', label: 'Past Simple — Irregular' },
          { type: 'leaf', id: 'present-continuous', label: 'Present Continuous' },
          { type: 'leaf', id: 'future-going-to', label: 'Future — going to' },
        ],
      },
      {
        type: 'category',
        label: 'Adjectives',
        children: [
          { type: 'leaf', id: 'comparatives', label: 'Comparatives' },
          { type: 'leaf', id: 'superlatives', label: 'Superlatives' },
        ],
      },
      {
        type: 'category',
        label: 'Questions',
        children: [
          { type: 'leaf', id: 'question-words', label: 'Question Words' },
        ],
      },
    ],
  },
  {
    level: 'B1',
    children: [
      {
        type: 'category',
        label: 'Tenses',
        children: [
          { type: 'leaf', id: 'present-perfect-simple', label: 'Present Perfect Simple' },
          { type: 'leaf', id: 'past-continuous', label: 'Past Continuous' },
          { type: 'leaf', id: 'future-will', label: 'Future — will' },
        ],
      },
      {
        type: 'category',
        label: 'Conditionals',
        children: [
          { type: 'leaf', id: 'zero-conditional', label: 'Zero Conditional' },
          { type: 'leaf', id: 'first-conditional', label: 'First Conditional' },
        ],
      },
      {
        type: 'category',
        label: 'Modals',
        children: [
          { type: 'leaf', id: 'can-could-ability', label: 'Can / Could — Ability' },
          { type: 'leaf', id: 'must-have-to', label: 'Must / Have to' },
        ],
      },
    ],
  },
  {
    level: 'B2',
    children: [
      {
        type: 'category',
        label: 'Tenses',
        children: [
          { type: 'leaf', id: 'present-perfect-continuous', label: 'Present Perfect Continuous' },
          { type: 'leaf', id: 'past-perfect', label: 'Past Perfect' },
          { type: 'leaf', id: 'future-perfect', label: 'Future Perfect' },
        ],
      },
      {
        type: 'category',
        label: 'Conditionals',
        children: [
          { type: 'leaf', id: 'second-conditional', label: 'Second Conditional' },
          { type: 'leaf', id: 'third-conditional', label: 'Third Conditional' },
        ],
      },
      {
        type: 'category',
        label: 'Passive Voice',
        children: [
          { type: 'leaf', id: 'passive-present', label: 'Passive — Present' },
          { type: 'leaf', id: 'passive-past', label: 'Passive — Past' },
        ],
      },
    ],
  },
  {
    level: 'C1',
    children: [
      {
        type: 'category',
        label: 'Advanced Tenses',
        children: [
          { type: 'leaf', id: 'mixed-conditionals', label: 'Mixed Conditionals' },
          { type: 'leaf', id: 'subjunctive', label: 'Subjunctive' },
        ],
      },
      {
        type: 'category',
        label: 'Advanced Grammar',
        children: [
          { type: 'leaf', id: 'inversion', label: 'Inversion' },
          { type: 'leaf', id: 'cleft-sentences', label: 'Cleft Sentences' },
          { type: 'leaf', id: 'participle-clauses', label: 'Participle Clauses' },
        ],
      },
    ],
  },
  {
    level: 'C2',
    children: [
      {
        type: 'category',
        label: 'Stylistics',
        children: [
          { type: 'leaf', id: 'register-and-tone', label: 'Register and Tone' },
          { type: 'leaf', id: 'advanced-idioms', label: 'Advanced Idioms' },
        ],
      },
      {
        type: 'category',
        label: 'Complex Structures',
        children: [
          { type: 'leaf', id: 'nominalization', label: 'Nominalisation' },
          { type: 'leaf', id: 'advanced-passive', label: 'Advanced Passive' },
        ],
      },
    ],
  },
]

/** Flatten tree to get all leaf lesson IDs */
export function getAllLessonIds(): string[] {
  const ids: string[] = []
  for (const level of GRAMMAR_TREE) {
    for (const cat of level.children) {
      for (const child of cat.children) {
        if (child.type === 'leaf') ids.push(child.id)
      }
    }
  }
  return ids
}

/** Get all leaves as flat list with level info for D3 hierarchy */
export function getFlatLessons(): Array<{ id: string; label: string; level: string; category: string }> {
  const lessons: Array<{ id: string; label: string; level: string; category: string }> = []
  for (const level of GRAMMAR_TREE) {
    for (const cat of level.children) {
      for (const child of cat.children) {
        if (child.type === 'leaf') {
          lessons.push({ id: child.id, label: child.label, level: level.level, category: cat.label })
        }
      }
    }
  }
  return lessons
}

/** Build a D3-compatible hierarchy object */
export function getHierarchyData() {
  return {
    id: 'root',
    label: 'Grammar',
    children: GRAMMAR_TREE.map(level => ({
      id: level.level,
      label: level.level,
      children: level.children.map(cat => ({
        id: `${level.level}-${cat.label}`,
        label: cat.label,
        children: cat.children.map(child =>
          child.type === 'leaf'
            ? { id: child.id, label: child.label, value: 1 }
            : child
        ),
      })),
    })),
  }
}
