/**
 * Smart Duplicate Cleaner & Audio Chunk Stitcher for Uzbek Speech Recognition
 *
 * Designed specifically for AKFA Workshop Management voice commands.
 * Handles:
 * - Consecutive duplicated words ("Aziz Aziz keldi" -> "Aziz keldi")
 * - Repeated N-gram phrase loops ("ali bugun 10 ali bugun 10" -> "ali bugun 10")
 * - Chunk boundary overlap stitching
 * - Streaming interim result deduplication without race conditions
 * - Strict preservation of legitimate business repetitions, quantities, and negations
 */

export interface CleanTranscriptResult {
  cleaned: string;
  original: string;
  wasCleaned: boolean;
  changes: string[];
}

// Natural Uzbek reduplicated words / adverbs that are grammatically legitimate
// and should NEVER be collapsed when repeated consecutively.
export const UZBEK_REDUPLICATED_WORDS = new Set([
  'asta',
  'kam',
  'tez',
  'kop',
  "ko'p",
  'oz',
  'bitta',
  'qadam',
  'chora',
  'dona',
  'qator',
  'xil',
  'butun',
]);

/**
 * Checks if a pair of identical consecutive words is an idiomatic Uzbek reduplication.
 * e.g. "asta-sekin" or "kam-kam", "ko'p-ko'p"
 */
export function isUzbekReduplication(w1: string, w2: string): boolean {
  const norm1 = w1.toLowerCase().replace(/['ʻ’‘`]/g, "'");
  const norm2 = w2.toLowerCase().replace(/['ʻ’‘`]/g, "'");
  if (norm1 !== norm2) return false;
  return UZBEK_REDUPLICATED_WORDS.has(norm1) || UZBEK_REDUPLICATED_WORDS.has(norm1.replace(/-/g, ''));
}

/**
 * Removes accidental consecutive identical single words, while preserving
 * words separated by punctuation or legitimate Uzbek reduplications.
 */
export function cleanConsecutiveWords(text: string): { text: string; modified: boolean } {
  if (!text) return { text: '', modified: false };

  const regex = /([a-zA-Z0-9\u0400-\u04FF']+)/g;
  const matches: Array<{ word: string; index: number; length: number }> = [];
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    matches.push({ word: match[1], index: match.index, length: match[1].length });
  }

  if (matches.length < 2) return { text, modified: false };

  let modified = false;
  const toRemove: Array<{ start: number; end: number }> = [];

  for (let i = 0; i < matches.length - 1; i++) {
    const cur = matches[i];
    const nxt = matches[i + 1];

    // Check if between cur and nxt there is a clause-ending punctuation (.,!?;:)
    const between = text.slice(cur.index + cur.length, nxt.index);
    if (/[,.!?;:]/.test(between)) {
      continue; // Separated by punctuation (e.g. separate clauses)
    }

    if (cur.word.toLowerCase() === nxt.word.toLowerCase()) {
      if (!isUzbekReduplication(cur.word, nxt.word)) {
        // Mark nxt for removal along with the leading whitespace
        toRemove.push({ start: cur.index + cur.length, end: nxt.index + nxt.length });
        modified = true;
      }
    }
  }

  if (!modified) return { text, modified: false };

  // Reconstruct string from right to left to maintain valid indices
  let result = text;
  for (let i = toRemove.length - 1; i >= 0; i--) {
    const rem = toRemove[i];
    result = result.slice(0, rem.start) + result.slice(rem.end);
  }

  return { text: result.replace(/\s+/g, ' ').trim(), modified: true };
}

/**
 * Detects and collapses repeated phrase loops (e.g. "ali bugun 10 ali bugun 10 ali bugun 10").
 * Preserves phrases separated by clause punctuation or legitimate conjunctions.
 */
export function cleanRepeatedPhraseLoops(
  text: string,
  maxWords: number = 8
): { text: string; modified: boolean } {
  if (!text) return { text: '', modified: false };
  let current = text.trim();
  let modifiedOverall = false;

  let keepGoing = true;
  let iterations = 0;

  while (keepGoing && iterations < 25) {
    iterations++;
    keepGoing = false;

    const words = current.split(/\s+/).filter(Boolean);
    if (words.length < 4) break;

    const maxL = Math.min(maxWords, Math.floor(words.length / 2));
    for (let L = maxL; L >= 2; L--) {
      let found = false;

      for (let i = 0; i <= words.length - 2 * L; i++) {
        const p1Raw = words.slice(i, i + L);
        const p2Raw = words.slice(i + L, i + 2 * L);

        const phrase1 = p1Raw.map((w) => w.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF']/gi, '')).join(' ');
        const phrase2 = p2Raw.map((w) => w.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF']/gi, '')).join(' ');

        // If normalized phrases match and are non-empty
        if (phrase1 === phrase2 && phrase1.length > 0) {
          const rawJoin1 = p1Raw.join(' ');

          // Safeguard: Never collapse if separated by comma or semicolon (e.g. "Azizga 25, Sardorga 25")
          if (rawJoin1.includes(',') || rawJoin1.includes(';')) {
            continue;
          }

          // Count consecutive repetitions
          let repetitions = 2;
          while (i + (repetitions + 1) * L <= words.length) {
            const nextP = words
              .slice(i + repetitions * L, i + (repetitions + 1) * L)
              .map((w) => w.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF']/gi, ''))
              .join(' ');

            if (nextP === phrase1) {
              repetitions++;
            } else {
              break;
            }
          }

          // Keep first occurrence, discard the consecutive repeats
          const newWords = [
            ...words.slice(0, i + L),
            ...words.slice(i + repetitions * L),
          ];

          current = newWords.join(' ');
          modifiedOverall = true;
          found = true;
          keepGoing = true;
          break;
        }
      }

      if (found) break;
    }
  }

  return { text: current, modified: modifiedOverall };
}

/**
 * Merges two consecutive speech chunks, detecting and stripping overlapping
 * boundary words that speech recognition engines frequently re-emit.
 */
export function mergeOverlappingChunks(chunkA: string, chunkB: string): string {
  if (!chunkA || !chunkA.trim()) return (chunkB || '').trim();
  if (!chunkB || !chunkB.trim()) return (chunkA || '').trim();

  const wordsA = chunkA.trim().split(/\s+/);
  const wordsB = chunkB.trim().split(/\s+/);

  const maxCheck = Math.min(wordsA.length, wordsB.length, 8);
  for (let k = maxCheck; k >= 1; k--) {
    const tailA = wordsA
      .slice(wordsA.length - k)
      .map((w) => w.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF']/gi, ''))
      .join(' ');

    const headB = wordsB
      .slice(0, k)
      .map((w) => w.toLowerCase().replace(/[^a-z0-9\u0400-\u04FF']/gi, ''))
      .join(' ');

    if (tailA === headB && tailA.length > 0) {
      // Overlap of k words found, discard the head duplicate from B
      return [...wordsA, ...wordsB.slice(k)].join(' ');
    }
  }

  return `${chunkA.trim()} ${chunkB.trim()}`;
}

/**
 * Main cleaning pipeline for transcript text.
 * Applies multi-pass deduplication while guaranteeing preservation of business data.
 */
export function cleanTranscript(raw: string): CleanTranscriptResult {
  if (!raw || !raw.trim()) {
    return {
      cleaned: '',
      original: raw || '',
      wasCleaned: false,
      changes: [],
    };
  }

  const original = raw.trim();
  const changes: string[] = [];

  // Pass 1: Clean consecutive identical single words
  let current = original;
  const p1 = cleanConsecutiveWords(current);
  if (p1.modified) {
    changes.push("Ketma-ket takrorlangan so'zlar tozalandi");
    current = p1.text;
  }

  // Pass 2: Clean repeated phrase loops (e.g. "ali bugun 10 ali bugun 10")
  const p2 = cleanRepeatedPhraseLoops(current);
  if (p2.modified) {
    changes.push('Takroriy ibora/segment halqalari tozalandi');
    current = p2.text;
  }

  // Pass 3: Second pass of consecutive words in case phrase reduction created a new duplicate
  const p3 = cleanConsecutiveWords(current);
  if (p3.modified) {
    current = p3.text;
  }

  // Pass 4: Fix common speech-to-text Uzbek typographical artifacts
  const normalized = current
    .replace(/\bkvadrad\b/gi, 'kvadrat')
    .replace(/\bkavdrat\b/gi, 'kvadrat')
    .replace(/\bkvadrt\b/gi, 'kvadrat')
    .replace(/\bobyo'm\b/gi, 'obyom')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s+/g, ' ')
    .trim();

  if (normalized !== current) {
    changes.push("Imlo va texnik so'zlar tuzatildi");
    current = normalized;
  }

  const wasCleaned = current !== original;

  return {
    cleaned: current,
    original,
    wasCleaned,
    changes,
  };
}

/**
 * Accumulator for real-time Web Speech API streaming events.
 * Prevents interim concatenation bugs and ensures finalized chunks
 * are committed strictly once with seamless overlap stitching.
 */
export class StreamingTranscriptAccumulator {
  private finalizedSegments: string[] = [];
  private interimSegment: string = '';
  private committedIndex: number = -1;

  reset(): void {
    this.finalizedSegments = [];
    this.interimSegment = '';
    this.committedIndex = -1;
  }

  handleSpeechEvent(event: any): string {
    if (!event || !event.results) return this.getFullText();

    let newFinalsAdded = false;

    for (let i = 0; i < event.results.length; i++) {
      const res = event.results[i];
      if (!res || !res[0]) continue;
      const text = (res[0].transcript || '').trim();
      if (!text) continue;

      if (res.isFinal) {
        if (i > this.committedIndex) {
          this.commitFinal(text);
          this.committedIndex = i;
          newFinalsAdded = true;
        }
      } else {
        if (i > this.committedIndex) {
          // Replace interim with latest interim (NEVER append)
          this.interimSegment = text;
        }
      }
    }

    if (newFinalsAdded) {
      this.interimSegment = '';
    }

    return this.getFullText();
  }

  commitFinal(text: string): void {
    if (!text) return;
    const cleanChunk = text.trim();
    if (!cleanChunk) return;

    if (this.finalizedSegments.length === 0) {
      this.finalizedSegments.push(cleanChunk);
    } else {
      const lastIndex = this.finalizedSegments.length - 1;
      const prev = this.finalizedSegments[lastIndex];

      // Exact duplicate check
      if (prev.toLowerCase() === cleanChunk.toLowerCase()) {
        return;
      }

      // Overlap merge check
      const merged = mergeOverlappingChunks(prev, cleanChunk);
      this.finalizedSegments[lastIndex] = merged;
    }
  }

  getFullText(): string {
    const parts = [...this.finalizedSegments];
    if (this.interimSegment.trim()) {
      // Check if interim has an overlap with the last finalized segment
      if (parts.length > 0) {
        const lastFinal = parts[parts.length - 1];
        const interimTrim = this.interimSegment.trim();
        const merged = mergeOverlappingChunks(lastFinal, interimTrim);
        if (merged !== `${lastFinal} ${interimTrim}`) {
          // It had an overlap, use merged representation
          parts[parts.length - 1] = merged;
          return parts.join(' ').replace(/\s+/g, ' ').trim();
        }
      }
      parts.push(this.interimSegment.trim());
    }

    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  getCleanedFullText(): string {
    const raw = this.getFullText();
    return cleanTranscript(raw).cleaned;
  }
}
