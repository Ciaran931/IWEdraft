import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ============================================================
// VOCAB WORDS
// ============================================================
const VOCAB_WORDS = [
  {
    id: 'able',
    word: 'able',
    pos: 'adjective',
    en_definition: 'having the power, skill, or means to do something',
    examples: ['She was able to finish the project on time.', 'Are you able to come tomorrow?'],
    translations: { pl: { word: 'zdolny, w stanie', definition: 'mający możliwość lub umiejętność zrobienia czegoś' } },
  },
  {
    id: 'begin',
    word: 'begin',
    pos: 'verb',
    en_definition: 'to start doing or experiencing something',
    examples: ['Let\'s begin the meeting.', 'She began to read the letter.'],
    translations: { pl: { word: 'zaczynać', definition: 'rozpoczynać coś' } },
  },
  {
    id: 'carry',
    word: 'carry',
    pos: 'verb',
    en_definition: 'to hold and move something from one place to another',
    examples: ['He carried the box upstairs.', 'Can you carry this bag for me?'],
    translations: { pl: { word: 'nieść, nosić', definition: 'trzymać i przenosić coś z miejsca na miejsce' } },
  },
  {
    id: 'decide',
    word: 'decide',
    pos: 'verb',
    en_definition: 'to make a choice after thinking about the options',
    examples: ['We need to decide quickly.', 'She decided to stay home.'],
    translations: { pl: { word: 'decydować', definition: 'dokonywać wyboru po rozważeniu opcji' } },
  },
  {
    id: 'early',
    word: 'early',
    pos: 'adjective',
    en_definition: 'before the usual or expected time',
    examples: ['She arrived early to the meeting.', 'He wakes up early every day.'],
    translations: { pl: { word: 'wczesny, wcześnie', definition: 'przed zwykłym lub oczekiwanym czasem' } },
  },
  {
    id: 'fact',
    word: 'fact',
    pos: 'noun',
    en_definition: 'something that is known to be true or real',
    examples: ['That is an interesting fact.', 'The facts speak for themselves.'],
    translations: { pl: { word: 'fakt', definition: 'coś, co jest znane jako prawdziwe lub realne' } },
  },
  {
    id: 'great',
    word: 'great',
    pos: 'adjective',
    en_definition: 'of an extent, amount, or intensity considerably above average',
    examples: ['She has a great talent for music.', 'That\'s a great idea!'],
    translations: { pl: { word: 'wielki, świetny', definition: 'znacznie powyżej przeciętnej' } },
  },
  {
    id: 'hard',
    word: 'hard',
    pos: 'adjective',
    en_definition: 'requiring a great deal of effort, endurance, or determination',
    examples: ['This is a hard problem to solve.', 'He works hard every day.'],
    translations: { pl: { word: 'trudny, ciężki', definition: 'wymagający dużego wysiłku lub determinacji' } },
  },
  {
    id: 'important',
    word: 'important',
    pos: 'adjective',
    en_definition: 'of great significance or value',
    examples: ['Sleep is important for your health.', 'This is an important decision.'],
    translations: { pl: { word: 'ważny', definition: 'mający wielkie znaczenie lub wartość' } },
  },
  {
    id: 'just',
    word: 'just',
    pos: 'adverb',
    en_definition: 'exactly; at this moment; simply; only',
    examples: ['I just arrived.', 'Just do your best.'],
    translations: { pl: { word: 'właśnie, tylko, po prostu', definition: 'dokładnie; w tej chwili; po prostu' } },
  },
  {
    id: 'keep',
    word: 'keep',
    pos: 'verb',
    en_definition: 'to have or retain something; to continue doing something',
    examples: ['Keep the change.', 'She keeps a diary every day.'],
    translations: { pl: { word: 'trzymać, utrzymywać', definition: 'mieć lub zatrzymywać coś; kontynuować' } },
  },
  {
    id: 'language',
    word: 'language',
    pos: 'noun',
    en_definition: 'a system of communication used by humans',
    examples: ['English is a global language.', 'Learning a new language takes time.'],
    translations: { pl: { word: 'język', definition: 'system komunikacji używany przez ludzi' } },
  },
  {
    id: 'mean',
    word: 'mean',
    pos: 'verb',
    en_definition: 'to intend to express or convey something; to have as a meaning',
    examples: ['What does this word mean?', 'I didn\'t mean to hurt you.'],
    translations: { pl: { word: 'oznaczać, mieć na myśli', definition: 'zamierzać wyrazić coś; mieć znaczenie' } },
  },
  {
    id: 'need',
    word: 'need',
    pos: 'verb',
    en_definition: 'to require something because it is essential or important',
    examples: ['I need more time.', 'Plants need sunlight to grow.'],
    translations: { pl: { word: 'potrzebować', definition: 'wymagać czegoś, ponieważ jest to niezbędne' } },
  },
  {
    id: 'often',
    word: 'often',
    pos: 'adverb',
    en_definition: 'many times; frequently',
    examples: ['I often go for walks in the evening.', 'How often do you exercise?'],
    translations: { pl: { word: 'często', definition: 'wiele razy; regularnie' } },
  },
  {
    id: 'people',
    word: 'people',
    pos: 'noun',
    en_definition: 'human beings in general; a group of persons',
    examples: ['Many people visited the museum.', 'People often judge by appearances.'],
    translations: { pl: { word: 'ludzie', definition: 'istoty ludzkie w ogóle; grupa osób' } },
  },
  {
    id: 'quickly',
    word: 'quickly',
    pos: 'adverb',
    en_definition: 'at a fast speed; with little delay',
    examples: ['She quickly finished her homework.', 'Please respond quickly.'],
    translations: { pl: { word: 'szybko', definition: 'z dużą prędkością; bez zwłoki' } },
  },
  {
    id: 'remember',
    word: 'remember',
    pos: 'verb',
    en_definition: 'to have something come back into your mind; to not forget',
    examples: ['Do you remember her name?', 'Remember to call me later.'],
    translations: { pl: { word: 'pamiętać', definition: 'przywoływać coś z pamięci; nie zapomnieć' } },
  },
  {
    id: 'some',
    word: 'some',
    pos: 'determiner',
    en_definition: 'an unspecified amount or number of something',
    examples: ['Can I have some water?', 'Some people prefer tea.'],
    translations: { pl: { word: 'trochę, kilka, niektóre', definition: 'nieokreślona ilość lub liczba czegoś' } },
  },
  {
    id: 'time',
    word: 'time',
    pos: 'noun',
    en_definition: 'the indefinite continued progress of existence; a point in this continuum',
    examples: ['Time passes quickly when you\'re busy.', 'What time is it?'],
    translations: { pl: { word: 'czas', definition: 'niedefiniowany ciągły postęp istnienia' } },
  },
  {
    id: 'understand',
    word: 'understand',
    pos: 'verb',
    en_definition: 'to perceive the meaning of something; to comprehend',
    examples: ['I understand your concern.', 'Do you understand the instructions?'],
    translations: { pl: { word: 'rozumieć', definition: 'pojmować znaczenie czegoś; pojmować' } },
  },
  {
    id: 'very',
    word: 'very',
    pos: 'adverb',
    en_definition: 'to a high degree; extremely',
    examples: ['She is very talented.', 'It\'s very cold outside.'],
    translations: { pl: { word: 'bardzo', definition: 'w wysokim stopniu; niezwykle' } },
  },
  {
    id: 'world',
    word: 'world',
    pos: 'noun',
    en_definition: 'the earth and all of its people; a particular sphere of human activity',
    examples: ['Travel opens your eyes to the world.', 'The world is changing fast.'],
    translations: { pl: { word: 'świat', definition: 'ziemia i wszyscy jej mieszkańcy; sfera działalności ludzkiej' } },
  },
  {
    id: 'year',
    word: 'year',
    pos: 'noun',
    en_definition: 'a period of 365 days (or 366 in a leap year)',
    examples: ['She graduated last year.', 'A year has twelve months.'],
    translations: { pl: { word: 'rok', definition: 'okres 365 (lub 366) dni' } },
  },
  {
    id: 'change',
    word: 'change',
    pos: 'verb',
    en_definition: 'to make or become different',
    examples: ['The weather can change quickly.', 'She changed her mind.'],
    translations: { pl: { word: 'zmieniać (się)', definition: 'czynić lub stawać się innym' } },
  },
  {
    id: 'different',
    word: 'different',
    pos: 'adjective',
    en_definition: 'not the same as another or each other; distinct',
    examples: ['We have different opinions.', 'This approach is different from the last one.'],
    translations: { pl: { word: 'różny, inny', definition: 'nie taki sam jak inny; odrębny' } },
  },
  {
    id: 'experience',
    word: 'experience',
    pos: 'noun',
    en_definition: 'practical contact with or observation of facts or events',
    examples: ['She has years of experience in teaching.', 'Travel is a valuable experience.'],
    translations: { pl: { word: 'doświadczenie', definition: 'praktyczny kontakt z faktami lub wydarzeniami' } },
  },
  {
    id: 'feel',
    word: 'feel',
    pos: 'verb',
    en_definition: 'to be aware of a sensation, emotion, or attitude',
    examples: ['I feel tired today.', 'How do you feel about the decision?'],
    translations: { pl: { word: 'czuć (się)', definition: 'być świadomym wrażenia, emocji lub nastawienia' } },
  },
  {
    id: 'happen',
    word: 'happen',
    pos: 'verb',
    en_definition: 'to take place; to occur',
    examples: ['What happened at the meeting?', 'Things like this happen sometimes.'],
    translations: { pl: { word: 'zdarzyć się, wydarzyć się', definition: 'mieć miejsce; wystąpić' } },
  },
  {
    id: 'idea',
    word: 'idea',
    pos: 'noun',
    en_definition: 'a thought or suggestion about a possible course of action',
    examples: ['That\'s a brilliant idea!', 'I have no idea what to do.'],
    translations: { pl: { word: 'pomysł, idea', definition: 'myśl lub sugestia dotycząca możliwego działania' } },
  },
  {
    id: 'learn',
    word: 'learn',
    pos: 'verb',
    en_definition: 'to gain knowledge or skill through study or experience',
    examples: ['Children learn quickly.', 'I want to learn Spanish.'],
    translations: { pl: { word: 'uczyć się', definition: 'zdobywać wiedzę lub umiejętności poprzez naukę lub doświadczenie' } },
  },
  {
    id: 'make',
    word: 'make',
    pos: 'verb',
    en_definition: 'to form, construct, or produce something',
    examples: ['She makes coffee every morning.', 'Let\'s make a plan.'],
    translations: { pl: { word: 'robić, tworzyć', definition: 'tworzyć lub produkować coś' } },
  },
  {
    id: 'new',
    word: 'new',
    pos: 'adjective',
    en_definition: 'produced, introduced, or discovered recently; not existing before',
    examples: ['I bought a new phone.', 'This is a new approach to the problem.'],
    translations: { pl: { word: 'nowy', definition: 'niedawno wyprodukowany lub odkryty; wcześniej nieistniejący' } },
  },
  {
    id: 'old',
    word: 'old',
    pos: 'adjective',
    en_definition: 'having lived or existed for a long time',
    examples: ['This is an old building.', 'My grandfather is very old.'],
    translations: { pl: { word: 'stary', definition: 'który istnieje od dawna' } },
  },
  {
    id: 'place',
    word: 'place',
    pos: 'noun',
    en_definition: 'a particular position, point, or area in space; a location',
    examples: ['This is a beautiful place.', 'Let\'s find a quiet place to talk.'],
    translations: { pl: { word: 'miejsce', definition: 'konkretna pozycja lub obszar w przestrzeni' } },
  },
  {
    id: 'problem',
    word: 'problem',
    pos: 'noun',
    en_definition: 'a matter or situation regarded as harmful, difficult, or wrong',
    examples: ['We need to solve this problem.', 'The traffic is a big problem in this city.'],
    translations: { pl: { word: 'problem', definition: 'sprawa lub sytuacja uznawana za trudną lub złą' } },
  },
  {
    id: 'result',
    word: 'result',
    pos: 'noun',
    en_definition: 'a consequence, effect, or outcome of something',
    examples: ['The result was better than expected.', 'Hard work leads to good results.'],
    translations: { pl: { word: 'wynik, rezultat', definition: 'konsekwencja, skutek lub rezultat czegoś' } },
  },
  {
    id: 'show',
    word: 'show',
    pos: 'verb',
    en_definition: 'to make something visible; to demonstrate or prove',
    examples: ['Show me how to do it.', 'The data shows an increase.'],
    translations: { pl: { word: 'pokazywać', definition: 'czynić coś widocznym; demonstrować lub dowodzić' } },
  },
  {
    id: 'think',
    word: 'think',
    pos: 'verb',
    en_definition: 'to have a particular opinion, belief, or idea about something',
    examples: ['I think we should leave early.', 'What do you think about this?'],
    translations: { pl: { word: 'myśleć, sądzić', definition: 'mieć określoną opinię lub przekonanie' } },
  },
  {
    id: 'use',
    word: 'use',
    pos: 'verb',
    en_definition: 'to take, hold, or employ something as a means of accomplishing a task',
    examples: ['Use a dictionary if you don\'t know a word.', 'How do you use this tool?'],
    translations: { pl: { word: 'używać', definition: 'stosować coś jako środek do osiągnięcia celu' } },
  },
  {
    id: 'way',
    word: 'way',
    pos: 'noun',
    en_definition: 'a method, style, or manner of doing something; a route or path',
    examples: ['There\'s always a way to solve a problem.', 'Which way do we go?'],
    translations: { pl: { word: 'sposób, droga', definition: 'metoda lub styl robienia czegoś; trasa lub ścieżka' } },
  },
  {
    id: 'work',
    word: 'work',
    pos: 'verb',
    en_definition: 'to do a job; to function or operate correctly',
    examples: ['She works at a hospital.', 'Does this machine work?'],
    translations: { pl: { word: 'pracować, działać', definition: 'wykonywać pracę; funkcjonować prawidłowo' } },
  },
  {
    id: 'able',
    word: 'able',
    pos: 'adjective',
    en_definition: 'having the power or skill to do something',
    examples: ['He was able to run 10km.'],
    translations: { pl: { word: 'zdolny, w stanie', definition: 'mający moc lub umiejętność zrobienia czegoś' } },
  },
  {
    id: 'beautiful',
    word: 'beautiful',
    pos: 'adjective',
    en_definition: 'pleasing the senses or mind aesthetically',
    examples: ['What a beautiful sunset!', 'She has a beautiful voice.'],
    translations: { pl: { word: 'piękny', definition: 'przyjemny dla zmysłów lub umysłu pod względem estetycznym' } },
  },
  {
    id: 'city',
    word: 'city',
    pos: 'noun',
    en_definition: 'a large town; an important urban centre',
    examples: ['London is a famous city.', 'She lives in the city centre.'],
    translations: { pl: { word: 'miasto', definition: 'duże miasto; ważne centrum miejskie' } },
  },
  {
    id: 'day',
    word: 'day',
    pos: 'noun',
    en_definition: 'a period of 24 hours; the time between sunrise and sunset',
    examples: ['It was a long day.', 'I go to the gym every day.'],
    translations: { pl: { word: 'dzień', definition: 'okres 24 godzin; czas między wschodem a zachodem słońca' } },
  },
  {
    id: 'eat',
    word: 'eat',
    pos: 'verb',
    en_definition: 'to put food in your mouth, chew it, and swallow it',
    examples: ['What do you usually eat for breakfast?', 'She didn\'t eat all day.'],
    translations: { pl: { word: 'jeść', definition: 'wkładać jedzenie do ust, żuć i połykać' } },
  },
  {
    id: 'find',
    word: 'find',
    pos: 'verb',
    en_definition: 'to discover something by searching or by chance',
    examples: ['Did you find your keys?', 'I found this book very interesting.'],
    translations: { pl: { word: 'znajdować', definition: 'odkrywać coś poprzez szukanie lub przypadek' } },
  },
  {
    id: 'good',
    word: 'good',
    pos: 'adjective',
    en_definition: 'to be desired or approved of; of high quality',
    examples: ['This is a good book.', 'She\'s good at cooking.'],
    translations: { pl: { word: 'dobry', definition: 'pożądany lub aprobowany; wysokiej jakości' } },
  },
  // Phrasal verbs
  {
    id: 'give-up',
    word: 'give up',
    pos: 'phrasal_verb',
    en_definition: 'to stop trying to do something; to surrender',
    examples: ['Don\'t give up on your dreams.', 'He gave up smoking last year.'],
    trigger_words: ['give', 'up'],
    translations: { pl: { word: 'poddawać się, rezygnować', definition: 'przestać próbować; kapitulować' } },
  },
  {
    id: 'take-off',
    word: 'take off',
    pos: 'phrasal_verb',
    en_definition: 'to remove clothing; (of an aircraft) to leave the ground',
    examples: ['The plane took off on time.', 'Take off your shoes at the door.'],
    trigger_words: ['take', 'off'],
    translations: { pl: { word: 'startować, zdejmować', definition: 'usuwać odzież; (o samolocie) oderwać się od ziemi' } },
  },
  {
    id: 'look-after',
    word: 'look after',
    pos: 'phrasal_verb',
    en_definition: 'to take care of someone or something',
    examples: ['She looks after her younger brother.', 'Who will look after the dog while we\'re away?'],
    trigger_words: ['look', 'after'],
    translations: { pl: { word: 'opiekować się', definition: 'dbać o kogoś lub coś' } },
  },
  {
    id: 'find-out',
    word: 'find out',
    pos: 'phrasal_verb',
    en_definition: 'to discover information or a fact',
    examples: ['I need to find out what time the train leaves.', 'She found out the truth.'],
    trigger_words: ['find', 'out'],
    translations: { pl: { word: 'dowiedzieć się', definition: 'odkryć informację lub fakt' } },
  },
  {
    id: 'make-up',
    word: 'make up',
    pos: 'phrasal_verb',
    en_definition: 'to invent a story; to reconcile after a disagreement',
    examples: ['He made up an excuse.', 'They argued but made up the next day.'],
    trigger_words: ['make', 'up'],
    translations: { pl: { word: 'wymyślać, godzić się', definition: 'wymyślać historię; godzić się po kłótni' } },
  },
]

// ============================================================
// TEXTS
// ============================================================
const TEXTS = [
  {
    id: 'morning-routine',
    title: 'A Morning in the City',
    level: 'A1',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'My name is Anna and I live in Warsaw.',
          'Every morning I wake up at seven o\'clock.',
          'I drink coffee and eat bread with butter.',
        ],
      },
      {
        id: 2,
        sentences: [
          'Then I get dressed and walk to the bus stop.',
          'The bus takes me to work in fifteen minutes.',
          'I work in a small office near the river.',
        ],
      },
      {
        id: 3,
        sentences: [
          'My colleagues are friendly and we work well together.',
          'At lunchtime I eat a sandwich in the park.',
          'In the evening I go home and read a book.',
        ],
      },
    ],
  },
  {
    id: 'market-trip',
    title: 'Shopping at the Market',
    level: 'A2',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'On Saturday mornings, Tom always goes to the local market.',
          'He enjoys looking at the fresh vegetables and colourful fruit.',
          'Last week he bought tomatoes, onions, and a big bag of apples.',
        ],
      },
      {
        id: 2,
        sentences: [
          'The market seller told him that the apples came from a nearby village.',
          'Tom was happy because they were cheaper than in the supermarket.',
          'He also found some honey and decided to try it.',
        ],
      },
      {
        id: 3,
        sentences: [
          'When he got home, he cooked a big pot of vegetable soup.',
          'His family thought it was delicious.',
          'Now he goes to the market every weekend.',
        ],
      },
    ],
  },
  {
    id: 'language-learning',
    title: 'Learning a New Language',
    level: 'B1',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'Learning a foreign language is one of the most rewarding challenges a person can take on.',
          'Research shows that people who speak more than one language have stronger memories and better problem-solving skills.',
          'However, many learners give up before they reach a comfortable level of fluency.',
        ],
      },
      {
        id: 2,
        sentences: [
          'One of the most effective methods is called comprehensible input.',
          'This approach means reading and listening to content that is just slightly above your current level.',
          'When you understand most of what you hear or read, your brain absorbs the language naturally.',
        ],
      },
      {
        id: 3,
        sentences: [
          'Consistency matters more than long study sessions.',
          'Even thirty minutes of daily practice will lead to steady improvement over time.',
          'The key is to find content you genuinely enjoy, so that learning feels less like work.',
        ],
      },
      {
        id: 4,
        sentences: [
          'Speaking with native speakers is valuable, but do not be afraid of making mistakes.',
          'Every error is a chance to learn something new.',
          'With patience and the right approach, anyone can become fluent in a foreign language.',
        ],
      },
    ],
  },
  {
    id: 'digital-revolution',
    title: 'The Digital Revolution',
    level: 'B2',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'Over the past three decades, digital technology has transformed almost every aspect of human life.',
          'The way we communicate, work, shop, and even think has been profoundly shaped by the internet and the devices we carry.',
          'While these changes have brought enormous benefits, they have also introduced serious challenges that societies are still struggling to address.',
        ],
      },
      {
        id: 2,
        sentences: [
          'The rise of social media has connected billions of people across the globe, enabling the rapid spread of ideas and information.',
          'Yet the same platforms that brought communities together have also been used to spread misinformation and amplify political polarisation.',
          'Algorithms designed to maximise engagement tend to reward content that triggers strong emotional reactions, often at the expense of accuracy.',
        ],
      },
      {
        id: 3,
        sentences: [
          'In the workplace, automation and artificial intelligence are reshaping entire industries.',
          'Jobs that once required years of training can now be performed by software, raising difficult questions about employment and economic inequality.',
          'At the same time, new categories of work have emerged that simply did not exist a generation ago.',
        ],
      },
      {
        id: 4,
        sentences: [
          'The digital revolution is not a single event but an ongoing process.',
          'How its benefits are distributed and its harms are mitigated will depend on the choices made by individuals, companies, and governments in the years ahead.',
        ],
      },
    ],
  },
  {
    id: 'memory-identity',
    title: 'Memory and Identity',
    level: 'C1',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'Our memories are not merely recordings of past events; they are the very foundation upon which we construct our sense of self.',
          'Without the continuity of memory, the coherent narrative we call identity would dissolve into a series of disconnected moments.',
          'This intimate relationship between recollection and selfhood has fascinated philosophers and psychologists for centuries.',
        ],
      },
      {
        id: 2,
        sentences: [
          'The philosopher John Locke argued that personal identity is constituted entirely by memory.',
          'On his account, a person at one time is the same person as a person at an earlier time if and only if the former can remember the experiences of the latter.',
          'Though this view has been challenged on many grounds, it captures something intuitively compelling about the role of memory in personal continuity.',
        ],
      },
      {
        id: 3,
        sentences: [
          'Modern neuroscience complicates the picture considerably.',
          'Memory is not a faithful archive but a reconstructive process, vulnerable to distortion, suggestion, and decay.',
          'Each time we recall an event, we subtly alter it, incorporating new information and the emotional colouring of the present moment.',
        ],
      },
      {
        id: 4,
        sentences: [
          'This malleability of memory raises profound questions about authenticity and self-knowledge.',
          'If the stories we tell about ourselves are, to some degree, fictions we have constructed and revised over time, what remains of the stable self we take ourselves to be?',
          'Perhaps identity is less a fixed essence than an ongoing act of imaginative synthesis.',
        ],
      },
    ],
  },
]

// ============================================================
// TEXT TRANSLATIONS (Polish)
// ============================================================
const TEXT_TRANSLATIONS = [
  {
    text_id: 'morning-routine',
    language_code: 'pl',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'Mam na imię Anna i mieszkam w Warszawie.',
          'Każdego ranka wstaję o siódmej.',
          'Piję kawę i jem chleb z masłem.',
        ],
      },
      {
        id: 2,
        sentences: [
          'Potem ubieram się i idę na przystanek autobusowy.',
          'Autobus dowozi mnie do pracy w piętnaście minut.',
          'Pracuję w małym biurze niedaleko rzeki.',
        ],
      },
      {
        id: 3,
        sentences: [
          'Moi współpracownicy są mili i dobrze nam się współpracuje.',
          'W porze lunchu jem kanapkę w parku.',
          'Wieczorem wracam do domu i czytam książkę.',
        ],
      },
    ],
  },
  {
    text_id: 'market-trip',
    language_code: 'pl',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'W sobotnie poranki Tom zawsze chodzi na lokalny targ.',
          'Lubi oglądać świeże warzywa i kolorowe owoce.',
          'W zeszłym tygodniu kupił pomidory, cebulę i duży worek jabłek.',
        ],
      },
      {
        id: 2,
        sentences: [
          'Sprzedawca powiedział mu, że jabłka pochodzą z pobliskiej wsi.',
          'Tom był zadowolony, bo były tańsze niż w supermarkecie.',
          'Znalazł też miód i postanowił go spróbować.',
        ],
      },
      {
        id: 3,
        sentences: [
          'Kiedy wrócił do domu, ugotował duży garnek zupy warzywnej.',
          'Jego rodzina uznała, że jest pyszna.',
          'Teraz chodzi na targ każdy weekend.',
        ],
      },
    ],
  },
  {
    text_id: 'language-learning',
    language_code: 'pl',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'Nauka języka obcego to jedno z najbardziej satysfakcjonujących wyzwań, jakie człowiek może podjąć.',
          'Badania pokazują, że osoby mówiące w więcej niż jednym języku mają lepszą pamięć i zdolności rozwiązywania problemów.',
          'Jednak wielu uczących się rezygnuje, zanim osiągnie komfortowy poziom biegłości.',
        ],
      },
      {
        id: 2,
        sentences: [
          'Jedną z najskuteczniejszych metod jest tzw. zrozumiały wkład językowy.',
          'To podejście polega na czytaniu i słuchaniu treści nieco powyżej twojego aktualnego poziomu.',
          'Gdy rozumiesz większość tego, co słyszysz lub czytasz, mózg przyswaja język w naturalny sposób.',
        ],
      },
      {
        id: 3,
        sentences: [
          'Regularność jest ważniejsza niż długie sesje nauki.',
          'Nawet trzydzieści minut codziennej praktyki przyniesie stały postęp.',
          'Kluczem jest znalezienie treści, które naprawdę lubisz, aby nauka była przyjemna.',
        ],
      },
      {
        id: 4,
        sentences: [
          'Rozmowa z native speakerami jest cenna, ale nie bój się popełniać błędów.',
          'Każdy błąd to okazja do nauki czegoś nowego.',
          'Przy cierpliwości i właściwym podejściu każdy może stać się biegły w języku obcym.',
        ],
      },
    ],
  },
  {
    text_id: 'digital-revolution',
    language_code: 'pl',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'W ciągu ostatnich trzech dekad technologia cyfrowa zmieniła niemal każdy aspekt życia człowieka.',
          'Sposób, w jaki komunikujemy się, pracujemy, robimy zakupy, a nawet myślimy, został głęboko ukształtowany przez internet i urządzenia, które nosimy.',
          'Chociaż te zmiany przyniosły ogromne korzyści, wiążą się też z poważnymi wyzwaniami.',
        ],
      },
      {
        id: 2,
        sentences: [
          'Wzrost mediów społecznościowych połączył miliardy ludzi na całym świecie.',
          'Jednak te same platformy, które zbliżyły społeczności, były też używane do szerzenia dezinformacji i polaryzacji politycznej.',
          'Algorytmy zaprojektowane tak, by maksymalizować zaangażowanie, nagradzają treści wywołujące silne emocje, często kosztem rzetelności.',
        ],
      },
      {
        id: 3,
        sentences: [
          'W miejscu pracy automatyzacja i sztuczna inteligencja przekształcają całe branże.',
          'Zawody, które niegdyś wymagały lat szkolenia, mogą być teraz wykonywane przez oprogramowanie.',
          'Jednocześnie pojawiły się nowe kategorie pracy, które po prostu nie istniały pokolenie temu.',
        ],
      },
      {
        id: 4,
        sentences: [
          'Rewolucja cyfrowa nie jest pojedynczym wydarzeniem, lecz trwającym procesem.',
          'To, jak jej korzyści są dystrybuowane i jak ograniczane są jej szkody, zależy od wyborów dokonywanych przez jednostki, firmy i rządy.',
        ],
      },
    ],
  },
  {
    text_id: 'memory-identity',
    language_code: 'pl',
    paragraphs: [
      {
        id: 1,
        sentences: [
          'Nasze wspomnienia nie są jedynie zapisami przeszłych wydarzeń; stanowią fundament, na którym budujemy poczucie własnej tożsamości.',
          'Bez ciągłości pamięci spójny narracja, którą nazywamy tożsamością, rozpadłaby się w serię niepowiązanych chwil.',
          'Ta intymna relacja między wspomnieniami a jaźnią od wieków fascynuje filozofów i psychologów.',
        ],
      },
      {
        id: 2,
        sentences: [
          'Filozof John Locke twierdził, że tożsamość osobowa jest konstytuowana wyłącznie przez pamięć.',
          'Według jego koncepcji, osoba w pewnym momencie jest tą samą osobą co osoba we wcześniejszym czasie, jeśli i tylko jeśli ta pierwsza może pamiętać doświadczenia tej drugiej.',
          'Choć pogląd ten był wielokrotnie kwestionowany, ujmuje coś intuicyjnie przekonującego na temat roli pamięci w ciągłości osobowej.',
        ],
      },
      {
        id: 3,
        sentences: [
          'Współczesna neurobiologia znacznie komplikuje ten obraz.',
          'Pamięć nie jest wiernym archiwum, lecz procesem rekonstrukcyjnym, podatnym na zniekształcenia, sugestię i zanikanie.',
          'Za każdym razem, gdy wspominamy jakieś zdarzenie, subtelnie je zmieniamy, włączając nowe informacje i emocjonalne zabarwienie chwili obecnej.',
        ],
      },
      {
        id: 4,
        sentences: [
          'Ta plastyczność pamięci rodzi głębokie pytania o autentyczność i samowiedzę.',
          'Jeśli opowieści, które snujemy o sobie, są w pewnym stopniu fikcjami, które skonstruowaliśmy i poprawiali z biegiem czasu, co pozostaje ze stabilnej jaźni, za którą się uważamy?',
          'Być może tożsamość jest mniej stałą istotą, a bardziej trwającym aktem wyobraźniowej syntezy.',
        ],
      },
    ],
  },
]

// ============================================================
// TEXT WORD OVERRIDES
// ============================================================
const TEXT_WORD_OVERRIDES = [
  {
    text_id: 'language-learning',
    word_id: 'find-out',
    en_definition: 'to discover or learn a fact through research or study',
    translations: { pl: { word: 'odkryć, dowiedzieć się', definition: 'odkryć fakt poprzez badania lub naukę' } },
  },
  {
    text_id: 'digital-revolution',
    word_id: 'work',
    en_definition: 'to function as part of a system or process (in the context of technology)',
    translations: { pl: { word: 'działać, funkcjonować', definition: 'funkcjonować jako część systemu lub procesu' } },
  },
  {
    text_id: 'memory-identity',
    word_id: 'make-up',
    en_definition: 'to constitute or form something (not cosmetics)',
    translations: { pl: { word: 'stanowić, tworzyć', definition: 'konstytuować lub tworzyć coś' } },
  },
]

// ============================================================
// GRAMMAR LESSONS
// ============================================================
const GRAMMAR_LESSONS = [
  {
    id: 'present-simple-positive',
    title: 'Present Simple — Positive Statements',
    level: 'A1',
    category: 'Tenses',
    order: 1,
    explanation: [
      { type: 'text', content: 'We use the present simple to talk about habits, routines, facts, and things that are generally true.' },
      { type: 'example', english: 'I drink coffee every morning.', translation: 'Piję kawę każdego ranka.' },
      { type: 'example', english: 'She works in a hospital.', translation: 'Ona pracuje w szpitalu.' },
      { type: 'rule', content: 'For he / she / it: add -s or -es to the verb. (work → works, go → goes, watch → watches)' },
      { type: 'example', english: 'He lives in London.', translation: 'On mieszka w Londynie.' },
      { type: 'text', content: 'Time expressions often used with the present simple: always, usually, often, sometimes, never, every day, on Mondays.' },
    ],
    questions: [
      {
        id: 'psp-q1',
        question: 'Which sentence is correct?',
        options: ['She work every day.', 'She works every day.', 'She working every day.', 'She is work every day.'],
        correct_index: 1,
        explanation: 'In the present simple, we add -s to the verb for he/she/it: "She works".',
      },
      {
        id: 'psp-q2',
        question: 'Which sentence uses the present simple correctly?',
        options: ['I am go to school.', 'I goes to school.', 'I go to school.', 'I going to school.'],
        correct_index: 2,
        explanation: 'With "I", the verb stays in its base form: "I go".',
      },
      {
        id: 'psp-q3',
        question: '"He ___ three languages." Choose the correct form.',
        options: ['speak', 'speaking', 'speaks', 'is speak'],
        correct_index: 2,
        explanation: '"He" is third person singular, so we add -s: "speaks".',
      },
      {
        id: 'psp-q4',
        question: 'Which time expression is most commonly used with the present simple?',
        options: ['right now', 'at this moment', 'every day', 'yesterday'],
        correct_index: 2,
        explanation: '"Every day" indicates a routine or habit, which is a core use of the present simple.',
      },
    ],
  },
  {
    id: 'present-simple-negative',
    title: 'Present Simple — Negative Statements',
    level: 'A1',
    category: 'Tenses',
    order: 2,
    explanation: [
      { type: 'text', content: 'To make a negative sentence in the present simple, use "do not" (don\'t) or "does not" (doesn\'t) before the base form of the verb.' },
      { type: 'rule', content: 'I / You / We / They → don\'t + verb. He / She / It → doesn\'t + verb.' },
      { type: 'example', english: 'I don\'t eat meat.', translation: 'Nie jem mięsa.' },
      { type: 'example', english: 'She doesn\'t like coffee.', translation: 'Ona nie lubi kawy.' },
      { type: 'text', content: 'Important: the main verb always stays in the base form after don\'t / doesn\'t — never add -s.' },
    ],
    questions: [
      {
        id: 'psn-q1',
        question: 'Which sentence is correct?',
        options: ['He don\'t work on Sundays.', 'He doesn\'t works on Sundays.', 'He doesn\'t work on Sundays.', 'He not works on Sundays.'],
        correct_index: 2,
        explanation: 'For he/she/it we use "doesn\'t" + base form: "doesn\'t work".',
      },
      {
        id: 'psn-q2',
        question: '"They ___ understand the question." Choose the correct form.',
        options: ['doesn\'t', 'not', 'don\'t', 'isn\'t'],
        correct_index: 2,
        explanation: 'For they/we/you/I we use "don\'t".',
      },
      {
        id: 'psn-q3',
        question: 'Which sentence has an error?',
        options: ['I don\'t like rain.', 'She doesn\'t eat fish.', 'He doesn\'t plays football.', 'We don\'t live here.'],
        correct_index: 2,
        explanation: 'After "doesn\'t", the verb must be in base form: "doesn\'t play" (not "plays").',
      },
      {
        id: 'psn-q4',
        question: '"She ___ drive." (make negative)',
        options: ['don\'t drive', 'doesn\'t drive', 'doesn\'t drives', 'isn\'t drive'],
        correct_index: 1,
        explanation: '"She" uses "doesn\'t" followed by the base form "drive".',
      },
    ],
  },
  {
    id: 'present-simple-questions',
    title: 'Present Simple — Questions',
    level: 'A1',
    category: 'Tenses',
    order: 3,
    explanation: [
      { type: 'text', content: 'To make a yes/no question in the present simple, put "Do" or "Does" at the start of the sentence.' },
      { type: 'rule', content: 'Do + I/you/we/they + verb? Does + he/she/it + verb?' },
      { type: 'example', english: 'Do you speak English?', translation: 'Czy mówisz po angielsku?' },
      { type: 'example', english: 'Does she live in Paris?', translation: 'Czy ona mieszka w Paryżu?' },
      { type: 'text', content: 'For wh- questions (what, where, when, why, who, how), put the question word first: Where do you live?' },
    ],
    questions: [
      {
        id: 'psq-q1',
        question: 'Which question is correct?',
        options: ['Does he lives here?', 'Does he live here?', 'Do he lives here?', 'Is he live here?'],
        correct_index: 1,
        explanation: '"Does" is used for he/she/it, followed by the base form "live".',
      },
      {
        id: 'psq-q2',
        question: '"___ they work on Saturdays?"',
        options: ['Does', 'Is', 'Are', 'Do'],
        correct_index: 3,
        explanation: '"They" uses "Do" to form questions.',
      },
      {
        id: 'psq-q3',
        question: 'Where does the question word go?',
        options: ['At the end', 'In the middle', 'Before the subject', 'After the verb'],
        correct_index: 2,
        explanation: 'The question word (what, where, when, etc.) goes at the beginning: "Where do you live?"',
      },
    ],
  },
  {
    id: 'articles',
    title: 'Articles (a / an / the)',
    level: 'A1',
    category: 'Nouns',
    order: 4,
    explanation: [
      { type: 'text', content: 'English has three articles: "a", "an", and "the". They tell us whether a noun is specific or general.' },
      { type: 'rule', content: 'Use "a" before consonant sounds: a cat, a book, a university. Use "an" before vowel sounds: an apple, an hour, an umbrella.' },
      { type: 'example', english: 'I saw a dog in the park.', translation: 'Widziałem psa w parku.' },
      { type: 'rule', content: 'Use "the" when both the speaker and listener know which thing is being talked about, or when something has been mentioned before.' },
      { type: 'example', english: 'I bought a book. The book was very interesting.', translation: 'Kupiłem książkę. Książka była bardzo ciekawa.' },
      { type: 'text', content: 'Use no article (zero article) for general plural nouns: "Dogs are friendly." and for most names of countries, cities, and people.' },
    ],
    questions: [
      {
        id: 'art-q1',
        question: '"She is ___ engineer." Which article is correct?',
        options: ['a', 'an', 'the', 'no article'],
        correct_index: 1,
        explanation: '"Engineer" starts with a vowel sound /ɛ/, so we use "an".',
      },
      {
        id: 'art-q2',
        question: '"I have ___ cat. ___ cat is black." Choose the correct pair.',
        options: ['the / a', 'a / the', 'a / a', 'the / the'],
        correct_index: 1,
        explanation: 'First mention: "a cat" (new, unspecific). Second mention: "the cat" (now specific, already mentioned).',
      },
      {
        id: 'art-q3',
        question: '"___ water is important for life." Which article?',
        options: ['A', 'An', 'The', 'No article'],
        correct_index: 3,
        explanation: 'General uncountable nouns like "water" take no article when used in a general sense.',
      },
      {
        id: 'art-q4',
        question: '"This is ___ university." Which article is correct?',
        options: ['an', 'a', 'the', 'no article'],
        correct_index: 1,
        explanation: '"University" starts with a /j/ sound (consonant), so we use "a", not "an".',
      },
    ],
  },
  {
    id: 'plural-nouns',
    title: 'Plural Nouns',
    level: 'A1',
    category: 'Nouns',
    order: 5,
    explanation: [
      { type: 'text', content: 'Most English nouns form the plural by adding -s. However, there are several patterns and irregular forms to learn.' },
      { type: 'rule', content: 'Regular: add -s → cat → cats, book → books, day → days.' },
      { type: 'rule', content: 'Nouns ending in -s, -sh, -ch, -x, -z: add -es → bus → buses, church → churches, box → boxes.' },
      { type: 'rule', content: 'Nouns ending in consonant + -y: change -y to -ies → city → cities, baby → babies.' },
      { type: 'example', english: 'There are three cities I want to visit.', translation: 'Są trzy miasta, które chcę odwiedzić.' },
      { type: 'rule', content: 'Irregular plurals must be memorised: man → men, woman → women, child → children, foot → feet, tooth → teeth.' },
    ],
    questions: [
      {
        id: 'pln-q1',
        question: 'What is the plural of "church"?',
        options: ['churchs', 'churches', 'churchies', 'church'],
        correct_index: 1,
        explanation: 'Nouns ending in -ch add -es: church → churches.',
      },
      {
        id: 'pln-q2',
        question: 'What is the plural of "city"?',
        options: ['citys', 'city\'s', 'cities', 'cityes'],
        correct_index: 2,
        explanation: 'Nouns ending in consonant + y change -y to -ies: city → cities.',
      },
      {
        id: 'pln-q3',
        question: 'Which is the correct plural of "child"?',
        options: ['childs', 'childes', 'children', 'childre'],
        correct_index: 2,
        explanation: '"Child" has an irregular plural: children.',
      },
      {
        id: 'pln-q4',
        question: 'What is the plural of "box"?',
        options: ['box\'s', 'boxies', 'boxs', 'boxes'],
        correct_index: 3,
        explanation: 'Nouns ending in -x add -es: box → boxes.',
      },
    ],
  },
]

// ============================================================
// SEED FUNCTION
// ============================================================
async function seed() {
  console.log('🌱 Seeding database...\n')

  // --- Vocab Words ---
  console.log('📚 Inserting vocab_words...')
  const uniqueWords = VOCAB_WORDS.filter(
    (word, index, self) => self.findIndex(w => w.id === word.id) === index
  )
  const { error: vocabError } = await supabase
    .from('vocab_words')
    .upsert(uniqueWords.map(({ ...w }) => w), { onConflict: 'id' })
  if (vocabError) console.error('vocab_words error:', vocabError.message)
  else console.log(`  ✓ ${uniqueWords.length} words inserted`)

  // --- Texts ---
  console.log('📖 Inserting texts...')
  const { error: textError } = await supabase
    .from('texts')
    .upsert(TEXTS, { onConflict: 'id' })
  if (textError) console.error('texts error:', textError.message)
  else console.log(`  ✓ ${TEXTS.length} texts inserted`)

  // --- Text Translations ---
  console.log('🌍 Inserting text_translations...')
  const { error: transError } = await supabase
    .from('text_translations')
    .upsert(TEXT_TRANSLATIONS, { onConflict: 'text_id,language_code' })
  if (transError) console.error('text_translations error:', transError.message)
  else console.log(`  ✓ ${TEXT_TRANSLATIONS.length} translations inserted`)

  // --- Text Word Overrides ---
  console.log('🔄 Inserting text_word_overrides...')
  const validOverrides = TEXT_WORD_OVERRIDES.filter(o => uniqueWords.some(w => w.id === o.word_id))
  if (validOverrides.length > 0) {
    const { error: overrideError } = await supabase
      .from('text_word_overrides')
      .upsert(validOverrides, { onConflict: 'text_id,word_id' })
    if (overrideError) console.error('text_word_overrides error:', overrideError.message)
    else console.log(`  ✓ ${validOverrides.length} overrides inserted`)
  }

  // --- Grammar Lessons ---
  console.log('🎓 Inserting grammar_lessons...')
  const lessonsToInsert = GRAMMAR_LESSONS.map(({ questions: _q, ...lesson }) => lesson)
  const { error: lessonError } = await supabase
    .from('grammar_lessons')
    .upsert(lessonsToInsert, { onConflict: 'id' })
  if (lessonError) console.error('grammar_lessons error:', lessonError.message)
  else console.log(`  ✓ ${lessonsToInsert.length} lessons inserted`)

  // --- Grammar Questions ---
  console.log('❓ Inserting grammar_questions...')
  const allQuestions = GRAMMAR_LESSONS.flatMap(lesson =>
    lesson.questions.map(q => ({ ...q, lesson_id: lesson.id }))
  )
  const { error: questionError } = await supabase
    .from('grammar_questions')
    .upsert(allQuestions, { onConflict: 'id' })
  if (questionError) console.error('grammar_questions error:', questionError.message)
  else console.log(`  ✓ ${allQuestions.length} questions inserted`)

  // --- Premade Deck ---
  console.log('🗂️  Creating premade deck...')
  const { data: premadeDeck, error: deckError } = await supabase
    .from('srs_decks')
    .upsert(
      {
        name: '100 Most Common Words',
        deck_type: 'premade',
        language_code: 'en',
        is_locked: false,
        user_id: null,
      },
      { onConflict: 'id', ignoreDuplicates: true }
    )
    .select('id')
    .single()

  if (deckError && !deckError.message.includes('duplicate')) {
    console.error('srs_decks error:', deckError.message)
  } else {
    console.log('  ✓ Premade deck created')
  }

  console.log('\n✅ Seed complete!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
