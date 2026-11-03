import { prisma } from '../prisma.js';
import { db } from '../store.js';

export interface WorkerCandidate {
  id: string;
  name: string;
  role: string;
  dailyRate: number;
  ratePerM2: number;
  status: string;
}

export interface WorkerMatchResult {
  success: boolean;
  worker?: WorkerCandidate;
  isAmbiguous?: boolean;
  potentialMatches?: WorkerCandidate[];
  unresolvedName?: string;
  confidence: number;
}

/**
 * Normalizes Uzbek text: strips diacritics, honorifics, and grammatical case suffixes.
 */
export function normalizeUzbekWord(word: string): string {
  if (!word) return '';

  let normalized = word
    .toLowerCase()
    .trim()
    .replace(/[ʻ’‘`]/g, "'")
    .replace(/[^a-z0-9' -]/gi, '');

  // Remove leading/trailing honorifics: "usta", "aka", "shogird", "tsex"
  normalized = normalized
    .replace(/^(usta|aka|uka|shogird)\s+/i, '')
    .replace(/\s+(usta|aka|uka|shogird)$/i, '');

  // Strip common Uzbek case suffixes (genitive -ning, dative -ga/-ka/-qa, accusative -ni, locative -da)
  normalized = normalized
    .replace(/ning$/i, '')
    .replace(/(ga|ka|qa)$/i, '')
    .replace(/ni$/i, '')
    .replace(/da$/i, '')
    .trim();

  return normalized;
}

/**
 * Calculates Levenshtein distance between two strings
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export class WorkerResolverService {
  /**
   * Retrieves active workers from database or in-memory fallback
   */
  async getActiveWorkers(): Promise<WorkerCandidate[]> {
    try {
      const records = await prisma.worker.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      });
      return records.map((w) => ({
        id: w.id,
        name: w.name,
        role: w.role,
        dailyRate: Number(w.dailyRate),
        ratePerM2: Number(w.ratePerM2 ?? 0),
        status: w.status,
      }));
    } catch {
      // In-memory fallback
      return db.workers
        .filter((w) => w.status === 'ACTIVE')
        .map((w) => ({
          id: w.id,
          name: w.name,
          role: w.role,
          dailyRate: Number(w.dailyRate),
          ratePerM2: Number(w.ratePerM2 ?? 0),
          status: w.status,
        }));
    }
  }

  /**
   * Resolves a spoken name against active workers with ambiguity detection
   */
  async resolveWorker(spokenName: string): Promise<WorkerMatchResult> {
    const rawSpoken = spokenName.trim();
    if (!rawSpoken) {
      return { success: false, confidence: 0, unresolvedName: spokenName };
    }

    const cleanSpoken = normalizeUzbekWord(rawSpoken);
    const workers = await this.getActiveWorkers();

    if (workers.length === 0) {
      return { success: false, confidence: 0, unresolvedName: spokenName };
    }

    // 1. Exact full name match (case-insensitive)
    const exactFullName = workers.find(
      (w) => w.name.toLowerCase().trim() === rawSpoken.toLowerCase() ||
             normalizeUzbekWord(w.name) === cleanSpoken
    );
    if (exactFullName) {
      return { success: true, worker: exactFullName, confidence: 1.0 };
    }

    // 2. Exact first name or single token match
    const matches: Array<{ worker: WorkerCandidate; score: number }> = [];

    for (const worker of workers) {
      const nameParts = worker.name.toLowerCase().split(/\s+/);
      const normalizedParts = nameParts.map(normalizeUzbekWord);

      // Does first name match exactly?
      if (normalizedParts[0] === cleanSpoken) {
        matches.push({ worker, score: 0.95 });
        continue;
      }

      // Does last name match exactly?
      if (normalizedParts.length > 1 && normalizedParts[1] === cleanSpoken) {
        matches.push({ worker, score: 0.90 });
        continue;
      }

      // Does full name contain spoken word?
      const fullNorm = normalizeUzbekWord(worker.name);
      if (fullNorm.includes(cleanSpoken) || cleanSpoken.includes(fullNorm)) {
        matches.push({ worker, score: 0.85 });
        continue;
      }

      // Levenshtein fuzzy match on first name
      const dist = levenshteinDistance(cleanSpoken, normalizedParts[0]);
      if (dist <= 1 && cleanSpoken.length >= 4) {
        matches.push({ worker, score: 0.80 });
      } else if (dist <= 2 && cleanSpoken.length >= 6) {
        matches.push({ worker, score: 0.70 });
      }
    }

    // Sort by highest score
    matches.sort((a, b) => b.score - a.score);

    if (matches.length === 0) {
      return {
        success: false,
        confidence: 0,
        unresolvedName: spokenName,
      };
    }

    // Check for ambiguity (e.g. multiple workers named "Aziz" or equal top score)
    const topScore = matches[0].score;
    const topMatches = matches.filter((m) => Math.abs(m.score - topScore) < 0.05);

    if (topMatches.length > 1) {
      return {
        success: false,
        isAmbiguous: true,
        potentialMatches: topMatches.map((m) => m.worker),
        unresolvedName: spokenName,
        confidence: topScore,
      };
    }

    return {
      success: true,
      worker: matches[0].worker,
      confidence: matches[0].score,
    };
  }
}

export const workerResolverService = new WorkerResolverService();
