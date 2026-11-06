import { cleanTranscript, CleanTranscriptResult } from '@akfa/shared';
import { workerResolverService, WorkerCandidate } from './worker-resolver.service.js';

export interface TranscriptCorrectionResult {
  originalTranscript: string;
  cleanedTranscript: string;
  wasCleaned: boolean;
  cleanReason?: string;
  method: 'AI_MODEL' | 'RULE_BASED' | 'NONE';
}

/**
 * Extracts numbers from text (both digits and standard Uzbek word numbers)
 */
function extractNumbers(text: string): number[] {
  const clean = text.toLowerCase().replace(/,/g, '.');
  const matches = clean.match(/\b\d+(?:\.\d+)?\b/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Extracts negation words from text
 */
const NEGATION_PATTERNS = [
  'kelmadi',
  'ishlamadi',
  "yo'q",
  'yoq',
  'emas',
  'kelgan emas',
  'kelmagan',
  'bajarilmadi',
  "to'lamadi",
  'tolamadi',
];

function extractNegations(text: string): string[] {
  const lower = text.toLowerCase().replace(/['ʻ’‘`]/g, "'");
  const found: string[] = [];
  for (const neg of NEGATION_PATTERNS) {
    if (lower.includes(neg)) {
      found.push(neg);
    }
  }
  return found;
}

export class AiTranscriptCorrectorService {
  private static instance: AiTranscriptCorrectorService;
  private geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';

  static getInstance(): AiTranscriptCorrectorService {
    if (!AiTranscriptCorrectorService.instance) {
      AiTranscriptCorrectorService.instance = new AiTranscriptCorrectorService();
    }
    return AiTranscriptCorrectorService.instance;
  }

  /**
   * Validates whether an AI or rule correction preserves business-critical invariants:
   * 1. No new numbers are invented, and legitimate numbers are not mutated or removed.
   * 2. All negations ("kelmadi", "emas", "yo'q", etc.) are strictly preserved.
   * 3. No worker names are substituted or altered.
   */
  validateCorrection(
    original: string,
    candidate: string,
    activeWorkers: WorkerCandidate[]
  ): { isValid: boolean; reason?: string } {
    if (!candidate || !candidate.trim()) {
      return { isValid: false, reason: "Tuzatilgan matn bo'sh" };
    }

    // 1. Invariant: Negations must never be stripped
    const originalNegations = extractNegations(original);
    const candidateNegations = extractNegations(candidate);

    for (const neg of originalNegations) {
      if (!candidateNegations.includes(neg)) {
        return {
          isValid: false,
          reason: `Inkor so'zi yo'qotildi: '${neg}'`,
        };
      }
    }

    // 2. Invariant: Numbers must not be changed (e.g. 25 -> 30)
    const originalNums = extractNumbers(original);
    const candidateNums = extractNumbers(candidate);

    for (const cNum of candidateNums) {
      if (!originalNums.includes(cNum)) {
        return {
          isValid: false,
          reason: `Yangi/o'zgartirilgan raqam kiritildi: ${cNum}`,
        };
      }
    }

    // Every distinct number in original must still be present in candidate
    const uniqueOriginalNums = Array.from(new Set(originalNums));
    for (const oNum of uniqueOriginalNums) {
      if (!candidateNums.includes(oNum)) {
        return {
          isValid: false,
          reason: `Muhim raqam yo'qotildi: ${oNum}`,
        };
      }
    }

    // 3. Invariant: Worker name preservation
    const origLower = original.toLowerCase();
    const candLower = candidate.toLowerCase();

    for (const worker of activeWorkers) {
      const wName = worker.name.toLowerCase();
      const firstName = wName.split(' ')[0];

      // If this worker was mentioned in original
      if (origLower.includes(firstName)) {
        // Must still be present in candidate
        if (!candLower.includes(firstName)) {
          return {
            isValid: false,
            reason: `Ishchi nomi yo'qotildi: '${worker.name}'`,
          };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Main entry point for transcript correction.
   * Pipeline:
   * 1. Algorithmic smart duplicate and phrase loop cleaner (always runs).
   * 2. If AI key is available, calls Gemini Flash model with strict prompt.
   * 3. Validates AI result against business-critical invariant rules.
   * 4. Returns original, cleaned, and method explanation.
   */
  async correctTranscript(
    rawTranscript: string,
    ownerId?: string
  ): Promise<TranscriptCorrectionResult> {
    const raw = (rawTranscript || '').trim();
    if (!raw) {
      return {
        originalTranscript: '',
        cleanedTranscript: '',
        wasCleaned: false,
        method: 'NONE',
      };
    }

    // 1. Run deterministic smart duplicate cleaner
    const ruleResult: CleanTranscriptResult = cleanTranscript(raw);
    let finalCleaned = ruleResult.cleaned;
    let method: 'AI_MODEL' | 'RULE_BASED' | 'NONE' = ruleResult.wasCleaned ? 'RULE_BASED' : 'NONE';
    let cleanReason = ruleResult.changes.join('; ') || undefined;

    // 2. Fetch active worker names for domain context
    let activeWorkers: WorkerCandidate[] = [];
    try {
      activeWorkers = await workerResolverService.getActiveWorkers();
    } catch {
      // Fallback if db offline
      activeWorkers = [];
    }

    // 3. If AI API key is configured, invoke Gemini for contextual refinement
    if (this.geminiKey) {
      try {
        const workerListStr = activeWorkers.map((w) => `${w.name} (${w.role})`).join(', ');

        const systemPrompt = `Sen AKFA rom va eshiklar tsexi boshqaruv tizimi uchun nutqni tozalash bo'yicha sun'iy intellektsan.
Vazifang: Foydalanuvchining o'zbekcha ovozli buyrug'idagi diktovka/STT xatolarini to'g'rilash.

FAOL ISHCHILAR RO'YXATI:
${workerListStr || "Jamshid Usta, Sherzod Aliyev, Azizbek Karimov, Ali, Botir"}

QAT'IY QOIDALAR:
1. Faqat tasodifiy takrorlangan so'zlar/iboralarni (masalan: "ali ali bugun", "25 kvadrat 25 kvadrat", "ali bugun 10 ali bugun 10") tozalang.
2. Qonuniy takrorlanishlarga TEGMA (masalan: "Azizga 25, Sardorga 25" - bu yerda ikkala 25 ham kerak!).
3. ISMLARNI O'ZGARTIRMA! Bitta ishchini boshqa ishchiga aylantirma. Ro'yxatdagi ismlar imlosini to'g'rila.
4. SONLAR VA MIQDORLARGA TEGMA! Hech qachon 25 ni 30 ga, 10 ni 15 ga o'zgartirma. Yangi raqam to'qima.
5. INKORLARNI QAT'IY SAQLA! "kelmadi", "kelgan emas", "ishlamadi", "yo'q", "emas" so'zlarini hech qachon olib tashlama va o'zgartirma!
6. Agar ishonching komil bo'lmasa, matnni o'z holicha qoldir.
7. Faqat JSON formatda javob ber:
{"cleanedText": "...", "wasCleaned": true, "reason": "..."}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.geminiKey}`;
        const payload = {
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemPrompt}\n\nASL MATN: "${ruleResult.cleaned}"` }],
            },
          ],
          generationConfig: {
            temperature: 0.0,
            responseMimeType: 'application/json',
          },
        };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(6000), // 6s timeout max
        });

        if (response.ok) {
          const data: any = await response.json();
          const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          if (jsonText) {
            const parsed = JSON.parse(jsonText);
            if (parsed.cleanedText) {
              const validation = this.validateCorrection(raw, parsed.cleanedText, activeWorkers);
              if (validation.isValid) {
                finalCleaned = parsed.cleanedText.trim();
                method = 'AI_MODEL';
                cleanReason = parsed.reason || 'AI tahlili orqali takrorlanishlar va imlo tozalandi';
              } else {
                console.warn('[AiTranscriptCorrector] AI output rejected by safety guardrails:', validation.reason);
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('[AiTranscriptCorrector] AI call failed or timed out, falling back to rule-based cleaner:', err.message);
      }
    }

    const wasCleaned = finalCleaned !== raw;
    if (!wasCleaned) {
      method = 'NONE';
    }

    return {
      originalTranscript: raw,
      cleanedTranscript: finalCleaned,
      wasCleaned,
      cleanReason,
      method,
    };
  }
}

export const aiTranscriptCorrectorService = AiTranscriptCorrectorService.getInstance();
