import { VoiceIntent, VoiceParsedCommand, VoiceAttendanceEntry, VoiceVolumeEntry } from '@akfa/shared';

/**
 * Returns ISO date YYYY-MM-DD strictly resolved in Asia/Tashkent timezone.
 */
export function getTashkentDate(offsetDays: number = 0): string {
  const now = new Date();
  if (offsetDays !== 0) {
    now.setDate(now.getDate() + offsetDays);
  }
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Tashkent',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now); // Produces YYYY-MM-DD
}

/**
 * Uzbek number word mapping
 */
const UZBEK_UNITS: Record<string, number> = {
  nol: 0,
  bir: 1,
  ikki: 2,
  uch: 3,
  "to'rt": 4,
  tort: 4,
  besh: 5,
  olti: 6,
  yetti: 7,
  sakkiz: 8,
  "to'qqiz": 9,
  toqqiz: 9,
};

const UZBEK_TENS: Record<string, number> = {
  "o'n": 10,
  on: 10,
  yigirma: 20,
  "o'ttiz": 30,
  ottiz: 30,
  qirq: 40,
  ellik: 50,
  oltmish: 60,
  yetmish: 70,
  sakson: 80,
  "to'qson": 90,
  toqson: 90,
};

const UZBEK_MULTIPLIERS: Record<string, number> = {
  yuz: 100,
  ming: 1000,
};

/**
 * Parses spoken Uzbek words into a numeric value
 */
export function parseUzbekNumber(phrase: string): number | null {
  if (!phrase) return null;

  const clean = phrase
    .toLowerCase()
    .replace(/[ʻ’‘`]/g, "'")
    .trim();

  // 1. Direct digit match (e.g. "25", "18.5", "14,5")
  const directMatch = clean.match(/^(\d+(?:[.,]\d+)?)$/);
  if (directMatch) {
    const val = parseFloat(directMatch[1].replace(',', '.'));
    return isNaN(val) ? null : val;
  }

  // 2. Check for "X yarim" (e.g. "14 yarim" -> 14.5, "o'n besh yarim" -> 15.5)
  let addHalf = false;
  let workText = clean;
  if (workText.endsWith('yarim')) {
    addHalf = true;
    workText = workText.replace(/\s*yarim$/, '').trim();
  }

  if (workText === '' && addHalf) {
    return 0.5;
  }

  // 3. Word-by-word arithmetic
  const tokens = workText.split(/\s+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let matchedAny = false;

  for (const token of tokens) {
    const num = parseFloat(token);
    if (!isNaN(num)) {
      current += num;
      matchedAny = true;
    } else if (UZBEK_UNITS[token] !== undefined) {
      current += UZBEK_UNITS[token];
      matchedAny = true;
    } else if (UZBEK_TENS[token] !== undefined) {
      current += UZBEK_TENS[token];
      matchedAny = true;
    } else if (UZBEK_MULTIPLIERS[token] !== undefined) {
      const mult = UZBEK_MULTIPLIERS[token];
      current = (current === 0 ? 1 : current) * mult;
      total += current;
      current = 0;
      matchedAny = true;
    }
  }

  total += current;
  if (addHalf) {
    total += 0.5;
  }

  return matchedAny ? total : null;
}

export class UzbekCommandParserService {
  /**
   * Main parsing method converting recognized Uzbek transcript into structured command.
   */
  async parseCommand(transcript: string, baseDate?: string): Promise<VoiceParsedCommand> {
    const raw = transcript.trim();
    if (!raw) {
      return {
        intent: 'get_daily_report',
        date: baseDate || getTashkentDate(),
        rawTranscript: raw,
        needsClarification: true,
        clarificationMessage: "Ovozli buyruq matni bo'sh. Iltimos, o'zbek tilida gapiring.",
      };
    }

    const clean = raw
      .toLowerCase()
      .replace(/[ʻ’‘`]/g, "'")
      .replace(/[.!?]/g, ' ');

    // 1. Resolve date
    let commandDate = baseDate || getTashkentDate();
    if (clean.includes('kecha') || clean.includes('kechagi')) {
      commandDate = getTashkentDate(-1);
    } else if (clean.includes('oldingi kun') || clean.includes("o'tgan kun")) {
      commandDate = getTashkentDate(-2);
    } else if (clean.includes('ertaga') || clean.includes('indin')) {
      return {
        intent: 'record_attendance',
        date: commandDate,
        rawTranscript: raw,
        needsClarification: true,
        clarificationMessage: "Kelgusi kunlar (ertaga) uchun hisob-kitob yoki davomat kiritish mumkin emas.",
      };
    }

    // 2. Identify Intent
    // Case A: Correct entry
    if (
      clean.includes("to'g'irla") ||
      clean.includes('togirla') ||
      clean.includes("o'zgartir") ||
      clean.includes('ozgartir') ||
      clean.includes('tuzat')
    ) {
      return this.parseCorrectEntry(raw, clean, commandDate);
    }

    // Case B: Worker Salary Query ("Azizning oylik maoshini ko'rsat", "Jamshid qancha ishladi")
    if (
      (clean.includes('maosh') || clean.includes('oylik') || clean.includes('ish haqi') || clean.includes('haqi') || clean.includes('hisob-kitobi')) &&
      (clean.includes("ko'rsat") || clean.includes('korsat') || clean.includes('qancha') || clean.includes('necha'))
    ) {
      return this.parseWorkerSalaryQuery(raw, clean, commandDate);
    }

    // Case C: Volume Report Query ("Shu oy qancha obyom bajarilgan?", "Oylik hajm hisoboti")
    if (
      (clean.includes('obyom') || clean.includes('hajm') || clean.includes('kvadrat')) &&
      (clean.includes('qancha') || clean.includes("ko'rsat") || clean.includes('korsat') || clean.includes('hisobot'))
    ) {
      return {
        intent: 'get_volume_report',
        date: commandDate,
        rawTranscript: raw,
      };
    }

    // Case D: Monthly Report Query ("Oylik hisobot", "Shu oy hisoboti")
    if (
      clean.includes('oylik hisobot') ||
      clean.includes('shu oylik hisobot') ||
      clean.includes('oy hisoboti') ||
      clean.includes('bu oylik hisobot')
    ) {
      return {
        intent: 'get_monthly_report',
        date: commandDate,
        rawTranscript: raw,
      };
    }

    // Case E: Daily Report Query ("Bugungi hisobot", "Bugun kim keldi")
    if (
      clean.includes('bugungi hisobot') ||
      clean.includes('kunlik hisobot') ||
      clean.includes('hisobotni') ||
      clean.includes('hisobot') ||
      clean.includes('kim keldi')
    ) {
      return {
        intent: 'get_daily_report',
        date: commandDate,
        rawTranscript: raw,
      };
    }

    // Case F: Record Volume ("Bugun Aziz 25 kvadrat, Sardor 18 kvadrat ishladi")
    if (
      clean.includes('kvadrat') ||
      clean.includes('kv') ||
      clean.includes('m2') ||
      clean.includes('m²') ||
      clean.includes('obyom') ||
      clean.includes('hajm')
    ) {
      return this.parseRecordVolume(raw, clean, commandDate);
    }

    // Case G: Record Attendance ("Bugun Aziz va Sardor keldi, Jasur kelmadi")
    if (
      clean.includes('keldi') ||
      clean.includes('kelmadi') ||
      clean.includes('davomat') ||
      clean.includes('yoq') ||
      clean.includes("yo'q")
    ) {
      return this.parseRecordAttendance(raw, clean, commandDate);
    }

    // If unclassifiable, ask for clarification
    return {
      intent: 'get_daily_report',
      date: commandDate,
      rawTranscript: raw,
      needsClarification: true,
      clarificationMessage:
        "Ovozli buyruq aniqlanmadi. Iltimos, masalan: 'Bugun Aziz 25 kvadrat ishladi' yoki 'Bugun Sardor keldi' deb ayting.",
    };
  }

  /**
   * Parses Volume Recording commands:
   * e.g. "Bugun Aziz 25 kvadrat, Sardor 18 kvadrat ishladi"
   */
  private parseRecordVolume(raw: string, clean: string, date: string): VoiceParsedCommand {
    // Strip date filler words
    const stripped = clean
      .replace(/\bbugun\b/g, '')
      .replace(/\bkecha\b/g, '')
      .replace(/\bishladi\b/g, '')
      .replace(/\bo'rnatdi\b/g, '')
      .replace(/\bornatdi\b/g, '')
      .replace(/\bqildi\b/g, '')
      .replace(/\byoz\b/g, '')
      .replace(/\btsex\b/g, '')
      .trim();

    const entries: VoiceVolumeEntry[] = [];

    // 1. First, scan for all "[Worker Name] [Number/Words] kvadrat" patterns
    const globalPattern = /(?:^|[,;]|\bva\b|\s+)([a-z' -]+?)\s+(\d+(?:[.,]\d+)?|[a-z' ]+?)\s*(?:kvadrat|kv|m2|m²|obyom)/gi;
    let gMatch: RegExpExecArray | null;
    while ((gMatch = globalPattern.exec(stripped)) !== null) {
      let potentialName = gMatch[1].trim();
      potentialName = potentialName.replace(/^(va|hamda)\s+/i, '').trim();
      const numStr = gMatch[2].trim();
      const m2 = parseUzbekNumber(numStr);

      if (potentialName && m2 !== null && m2 > 0) {
        if (!entries.some((e) => e.workerName.toLowerCase() === potentialName.toLowerCase())) {
          entries.push({
            workerName: potentialName,
            squareMeters: m2,
          });
        }
      }
    }

    // 2. If nothing matched yet, fallback to splitting by conjunctions/parts
    if (entries.length === 0) {
      const parts = stripped.split(/\bva\b|\bhamda\b|[,;]/).map((p) => p.trim()).filter(Boolean);

      for (const part of parts) {
        const matchPattern1 = part.match(/([a-z' -]+?)\s+(\d+(?:[.,]\d+)?|[a-z' ]+?)\s*(?:kvadrat|kv|m2|m²|obyom)/i);
        const matchPattern2 = part.match(/(\d+(?:[.,]\d+)?|[a-z' ]+?)\s*(?:kvadrat|kv|m2|m²|obyom)\s+([a-z' -]+)/i);

        if (matchPattern1) {
          const potentialName = matchPattern1[1].trim();
          const numStr = matchPattern1[2].trim();
          const m2 = parseUzbekNumber(numStr);

          if (potentialName && m2 !== null && m2 > 0) {
            entries.push({
              workerName: potentialName,
              squareMeters: m2,
            });
            continue;
          }
        }

        if (matchPattern2) {
          const numStr = matchPattern2[1].trim();
          const potentialName = matchPattern2[2].trim();
          const m2 = parseUzbekNumber(numStr);

          if (potentialName && m2 !== null && m2 > 0) {
            entries.push({
              workerName: potentialName,
              squareMeters: m2,
            });
            continue;
          }
        }

        // Fallback single worker pattern: e.g. "Aziz 25"
        const singleMatch = part.match(/([a-z' -]+?)\s+(\d+(?:[.,]\d+)?)/i);
        if (singleMatch) {
          const potentialName = singleMatch[1].trim();
          const m2 = parseFloat(singleMatch[2].replace(',', '.'));
          if (potentialName && !isNaN(m2) && m2 > 0) {
            entries.push({
              workerName: potentialName,
              squareMeters: m2,
            });
          }
        }
      }
    }

    if (entries.length === 0) {
      return {
        intent: 'record_volume',
        date,
        rawTranscript: raw,
        needsClarification: true,
        clarificationMessage:
          "Hajm (kvadrat metr) yoki ishchi ismi aniqlanmadi. Masalan: 'Bugun Aziz 25 kvadrat ishladi' deb ayting.",
      };
    }

    return {
      intent: 'record_volume',
      date,
      entries,
      rawTranscript: raw,
    };
  }

  /**
   * Parses Attendance Recording commands:
   * e.g. "Bugun Aziz va Sardor keldi, Jasur kelmadi"
   */
  private parseRecordAttendance(raw: string, clean: string, date: string): VoiceParsedCommand {
    const entries: VoiceAttendanceEntry[] = [];

    // Split clauses by "keldi", "kelmadi", "yo'q", "bor"
    // Also handle clauses separated by commas, "va", "lekin", "ammo"
    const clauses = clean.split(/[,;]|\blekin\b|\bammo\b|\besa\b/).map((c) => c.trim()).filter(Boolean);

    for (const clause of clauses) {
      const isAbsent = clause.includes('kelmadi') || clause.includes("yo'q") || clause.includes('yoq') || clause.includes('kemadi');
      const isPresent = clause.includes('keldi') || clause.includes('bor') || clause.includes('ishda');
      const isHalfDay = clause.includes('yarim') || clause.includes('0.5') || clause.includes('pol');

      if (!isAbsent && !isPresent) continue;

      const status = isAbsent ? 'ABSENT' : 'PRESENT';

      // Clean clause to isolate names
      const cleanedClause = clause
        .replace(/\bbugun\b/g, '')
        .replace(/\bkecha\b/g, '')
        .replace(/\bkeldi\b/g, '')
        .replace(/\bkelmadi\b/g, '')
        .replace(/\bkemadi\b/g, '')
        .replace(/\byo'q\b/g, '')
        .replace(/\byoq\b/g, '')
        .replace(/\bbor\b/g, '')
        .replace(/\bishda\b/g, '')
        .replace(/\byarim kun\b/g, '')
        .replace(/\byarim\b/g, '')
        .replace(/\bkun\b/g, '')
        .replace(/\bham\b/g, '')
        .trim();

      // Names in this clause can be joined with "va", "hamda"
      const names = cleanedClause.split(/\bva\b|\bhamda\b/).map((n) => n.trim()).filter(Boolean);

      for (const name of names) {
        if (name.length >= 2) {
          entries.push({
            workerName: name,
            status,
            isHalfDay: status === 'PRESENT' && isHalfDay,
          });
        }
      }
    }

    if (entries.length === 0) {
      return {
        intent: 'record_attendance',
        date,
        rawTranscript: raw,
        needsClarification: true,
        clarificationMessage:
          "Davomatda ishchi ismi yoki holati (keldi / kelmadi) aniqlanmadi. Masalan: 'Bugun Aziz keldi, Sardor kelmadi' deb ayting.",
      };
    }

    return {
      intent: 'record_attendance',
      date,
      entries,
      rawTranscript: raw,
    };
  }

  /**
   * Parses Worker Salary Queries:
   * e.g. "Azizning oylik maoshini ko'rsat"
   */
  private parseWorkerSalaryQuery(raw: string, clean: string, date: string): VoiceParsedCommand {
    const cleaned = clean
      .replace(/\boylik\b/g, '')
      .replace(/\bmaoshini\b/g, '')
      .replace(/\bmaoshi\b/g, '')
      .replace(/\bish haqini\b/g, '')
      .replace(/\bish haqi\b/g, '')
      .replace(/\bhaqini\b/g, '')
      .replace(/\bhaqi\b/g, '')
      .replace(/\bhisob-kitobi\b/g, '')
      .replace(/\bhisob-kitobini\b/g, '')
      .replace(/\bko'rsat\b/g, '')
      .replace(/\bkorsat\b/g, '')
      .replace(/\bqancha\b/g, '')
      .replace(/\bnecha\b/g, '')
      .replace(/\bbo'ldi\b/g, '')
      .replace(/\bboldi\b/g, '')
      .trim();

    const workerName = cleaned || undefined;

    return {
      intent: 'get_worker_salary',
      date,
      workerName,
      rawTranscript: raw,
      needsClarification: !workerName,
      clarificationMessage: !workerName
        ? "Qaysi ishchining maoshini ko'rmoqchisiz? Masalan: 'Jamshidning oylik maoshini ko'rsat' deb ayting."
        : undefined,
    };
  }

  /**
   * Parses Correct Entry commands:
   * e.g. "Azizning hajmini 20 kvadratga o'zgartir"
   */
  private parseCorrectEntry(raw: string, clean: string, date: string): VoiceParsedCommand {
    if (clean.includes('kvadrat') || clean.includes('m2') || clean.includes('obyom') || clean.includes('hajm')) {
      const volRes = this.parseRecordVolume(raw, clean, date);
      return {
        ...volRes,
        intent: 'correct_entry',
      };
    }

    if (clean.includes('keldi') || clean.includes('kelmadi')) {
      const attRes = this.parseRecordAttendance(raw, clean, date);
      return {
        ...attRes,
        intent: 'correct_entry',
      };
    }

    return {
      intent: 'correct_entry',
      date,
      rawTranscript: raw,
      needsClarification: true,
      clarificationMessage:
        "Tuzatish turi aniqlanmadi. Masalan: 'Azizning hajmini 20 kvadratga o'zgartir' yoki 'Sardorni kelmadi deb to'g'irla' deb ayting.",
    };
  }
}

export const uzbekCommandParserService = new UzbekCommandParserService();
