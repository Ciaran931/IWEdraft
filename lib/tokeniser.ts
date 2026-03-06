export interface Token {
  type: 'word' | 'phrasal' | 'punct'
  id?: string
  display: string
}

export interface PhrasalVerbEntry {
  id: string
  trigger_words: string[]
}

/**
 * Tokenises an English sentence into an array of Tokens.
 * Pass 1 scans for phrasal verbs; pass 2 wraps remaining single words.
 * Punctuation and whitespace are returned as 'punct' tokens.
 */
export function tokenise(sentence: string, phrasalVerbs: PhrasalVerbEntry[]): Token[] {
  // Split into alternating [word, separator, word, ...] segments
  const segments = sentence.split(/(\s+|[.,!?;:—–"'()\[\]{}])/).filter(Boolean)
  const tokens: Token[] = []
  let i = 0

  while (i < segments.length) {
    const seg = segments[i]
    const normalized = seg.toLowerCase().replace(/[^a-z''-]/g, '')

    if (!/^[a-zA-Z''-]+$/.test(seg)) {
      // Punctuation or whitespace
      tokens.push({ type: 'punct', display: seg })
      i++
      continue
    }

    // Pass 1: check for phrasal verb starting here
    let foundPhrasal = false
    for (const pv of phrasalVerbs) {
      const triggers = pv.trigger_words
      if (triggers[0] !== normalized) continue

      // Collect the next N word-segments (skipping whitespace) to match triggers
      const wordSegs: { idx: number; seg: string }[] = []
      let j = i
      while (wordSegs.length < triggers.length && j < segments.length) {
        if (/^[a-zA-Z''-]+$/.test(segments[j])) {
          wordSegs.push({ idx: j, seg: segments[j] })
        }
        j++
      }

      if (wordSegs.length < triggers.length) break

      const match = wordSegs.every(
        ({ seg: s }, k) => s.toLowerCase().replace(/[^a-z''-]/g, '') === triggers[k]
      )

      if (match) {
        const display = wordSegs.map(w => w.seg).join(' ')
        tokens.push({ type: 'phrasal', id: pv.id, display })
        // Advance i past all consumed segments up to last matched word
        i = wordSegs[wordSegs.length - 1].idx + 1
        foundPhrasal = true
        break
      }
    }

    if (!foundPhrasal) {
      tokens.push({ type: 'word', id: normalized || seg.toLowerCase(), display: seg })
      i++
    }
  }

  return tokens
}
