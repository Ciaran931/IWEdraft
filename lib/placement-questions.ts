export interface PlacementQuestion {
  level: string
  question: string
  options: string[]
  correctIndex: number
}

export const PLACEMENT_QUESTIONS: PlacementQuestion[] = [
  // A1 (4 questions)
  {
    level: 'A1',
    question: 'She ___ a student.',
    options: ['am', 'is', 'are', 'be'],
    correctIndex: 1,
  },
  {
    level: 'A1',
    question: 'I ___ coffee every morning.',
    options: ['drink', 'drinks', 'drinking', 'drank'],
    correctIndex: 0,
  },
  {
    level: 'A1',
    question: 'There are three ___ on the table.',
    options: ['book', 'books', 'bookes', 'a book'],
    correctIndex: 1,
  },
  {
    level: 'A1',
    question: 'He ___ like cheese.',
    options: ["don't", "doesn't", "isn't", "not"],
    correctIndex: 1,
  },

  // A2 (4 questions)
  {
    level: 'A2',
    question: 'I ___ to London last summer.',
    options: ['go', 'went', 'gone', 'going'],
    correctIndex: 1,
  },
  {
    level: 'A2',
    question: 'She is ___ than her sister.',
    options: ['tall', 'taller', 'tallest', 'more tall'],
    correctIndex: 1,
  },
  {
    level: 'A2',
    question: 'Look! It ___.',
    options: ['rains', 'rain', 'is raining', 'rained'],
    correctIndex: 2,
  },
  {
    level: 'A2',
    question: 'We ___ go to the cinema tonight.',
    options: ['going to', 'are going to', 'will to', 'go to'],
    correctIndex: 1,
  },

  // B1 (4 questions)
  {
    level: 'B1',
    question: 'I ___ never ___ sushi before.',
    options: ['have / eaten', 'had / eat', 'have / ate', 'did / eaten'],
    correctIndex: 0,
  },
  {
    level: 'B1',
    question: 'If you heat water to 100°C, it ___.',
    options: ['will boil', 'boils', 'would boil', 'boiled'],
    correctIndex: 1,
  },
  {
    level: 'B1',
    question: 'You ___ drive without a licence. It is illegal.',
    options: ["don't have to", "mustn't", "shouldn't", "couldn't"],
    correctIndex: 1,
  },
  {
    level: 'B1',
    question: 'If it rains tomorrow, we ___ stay home.',
    options: ['will', 'would', 'can', 'are'],
    correctIndex: 0,
  },

  // B2 (4 questions)
  {
    level: 'B2',
    question: 'By the time we arrived, the film ___.',
    options: ['already started', 'had already started', 'has already started', 'was already starting'],
    correctIndex: 1,
  },
  {
    level: 'B2',
    question: 'If I ___ more money, I would travel the world.',
    options: ['have', 'had', 'would have', 'having'],
    correctIndex: 1,
  },
  {
    level: 'B2',
    question: 'The bridge ___ in 1894.',
    options: ['built', 'was built', 'has built', 'is built'],
    correctIndex: 1,
  },
  {
    level: 'B2',
    question: 'I have been studying English ___ three years.',
    options: ['since', 'for', 'during', 'from'],
    correctIndex: 1,
  },
]
