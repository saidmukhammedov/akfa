/**
 * AKFA — Smart Transcription Cleaning & Accuracy Improvement Regression Test Suite
 *
 * Covers:
 * A. Accidental duplicates (single words, repeated phrases, mobile streaming loop artifacts)
 * B. Legitimate repetitions (multiple workers sharing quantities, distinct sentences, reduplications)
 * C. Business-critical phrases (negations, corrections, accurate worker & volume preservation)
 * D. Technical regressions (streaming accumulator, duplicate final events, chunk overlap merging, empty/partial transcripts)
 * E. Semantic Guardrails (rejection of unsafe AI modifications: altered numbers, replaced workers, removed negations)
 */

import assert from 'node:assert';
import {
  cleanTranscript,
  cleanConsecutiveWords,
  cleanRepeatedPhraseLoops,
  mergeOverlappingChunks,
  StreamingTranscriptAccumulator,
} from '@akfa/shared';
import { aiTranscriptCorrectorService } from '../dist/services/voice/ai-transcript-corrector.service.js';
import { voiceOrchestratorService } from '../dist/services/voice/voice-orchestrator.service.js';

console.log('================================================================');
console.log('>>> AKFA SMART TRANSCRIPTION CLEANING REGRESSION TEST SUITE <<<');
console.log('================================================================\n');

let testsPassed = 0;
function pass(msg) {
  console.log(`✓ [PASS] ${msg}`);
  testsPassed++;
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP A: Accidental duplicates
// ─────────────────────────────────────────────────────────────────────────────
console.log('--- A. ACCIDENTAL DUPLICATES ---');

// A1: "Aziz Aziz keldi."
{
  const input = 'Aziz Aziz keldi.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Aziz keldi.');
  assert.strictEqual(res.wasCleaned, true);
  pass('A1: "Aziz Aziz keldi." -> "Aziz keldi."');
}

// A2: "Bugun bugun 25 kvadrat."
{
  const input = 'Bugun bugun 25 kvadrat.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Bugun 25 kvadrat.');
  assert.strictEqual(res.wasCleaned, true);
  pass('A2: "Bugun bugun 25 kvadrat." -> "Bugun 25 kvadrat."');
}

// A3: "Sardor Sardor ishga kelmadi."
{
  const input = 'Sardor Sardor ishga kelmadi.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Sardor ishga kelmadi.');
  assert.strictEqual(res.wasCleaned, true);
  pass('A3: "Sardor Sardor ishga kelmadi." -> "Sardor ishga kelmadi."');
}

// A4: Real-world Android WebKit speech recognition loop from user screenshot:
{
  const horrorInput =
    'ali ali bugun ali bugun ali bugun ali bugun ali bugun ali bugun 10 ali bugun 10 ali bugun 10 ali bugun 10 kvadrat ali bugun 10 kvadrat ali bugun 10 kvadrat metr ali bugun 10 kvadrat metr ali bugun 10 kvadrat metr ish qildi';
  const res = cleanTranscript(horrorInput);
  assert.strictEqual(res.cleaned, 'ali bugun 10 kvadrat metr ish qildi');
  assert.strictEqual(res.wasCleaned, true);
  pass('A4: Real-world mobile speech loop collapsed cleanly to "ali bugun 10 kvadrat metr ish qildi"');
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP B: Legitimate repetitions (MUST BE PRESERVED)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- B. LEGITIMATE REPETITIONS (PRESERVATION VERIFIED) ---');

// B1: "Azizga 25, Sardorga 25 kvadrat yoz."
{
  const input = 'Azizga 25, Sardorga 25 kvadrat yoz.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Azizga 25, Sardorga 25 kvadrat yoz.');
  assert.strictEqual(res.wasCleaned, false);
  pass('B1: "Azizga 25, Sardorga 25 kvadrat yoz." preserved intact (both 25s preserved)');
}

// B2: "Bugun 10 kvadrat, ertaga yana 10 kvadrat."
{
  const input = 'Bugun 10 kvadrat, ertaga yana 10 kvadrat.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Bugun 10 kvadrat, ertaga yana 10 kvadrat.');
  assert.strictEqual(res.wasCleaned, false);
  pass('B2: "Bugun 10 kvadrat, ertaga yana 10 kvadrat." preserved intact across clauses');
}

// B3: "Aziz keldi, Aziz obyom ham qildi."
{
  const input = 'Aziz keldi, Aziz obyom ham qildi.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Aziz keldi, Aziz obyom ham qildi.');
  assert.strictEqual(res.wasCleaned, false);
  pass('B3: "Aziz keldi, Aziz obyom ham qildi." preserved intact (name across distinct clauses)');
}

// B4: Natural Uzbek reduplications
{
  const input = "Ustalar asta-sekin ishni tugatmoqda, kam-kam berib turing.";
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, input);
  pass('B4: Natural Uzbek reduplications (asta-sekin, kam-kam) preserved without false positives');
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP C: Business-critical phrases
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- C. BUSINESS-CRITICAL PHRASES (NEGATIONS, WORKERS, AMOUNTS) ---');

// C1: "Anvar kelmadi."
{
  const input = 'Anvar kelmadi.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Anvar kelmadi.');
  assert.strictEqual(res.cleaned.includes('kelmadi'), true);
  pass('C1: "Anvar kelmadi." negation preserved 100%');
}

// C2: "Anvar kelmadi, Aziz keldi."
{
  const input = 'Anvar kelmadi, Aziz keldi.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Anvar kelmadi, Aziz keldi.');
  assert.strictEqual(res.cleaned.includes('kelmadi'), true);
  assert.strictEqual(res.cleaned.includes('keldi'), true);
  pass('C2: "Anvar kelmadi, Aziz keldi." both workers and opposite attendance states preserved');
}

// C3: "Aziz 25 kvadrat, Sardor 18 kvadrat."
{
  const input = 'Aziz 25 kvadrat, Sardor 18 kvadrat.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Aziz 25 kvadrat, Sardor 18 kvadrat.');
  pass('C3: "Aziz 25 kvadrat, Sardor 18 kvadrat." individual square-meter assignments preserved');
}

// C4: "Aziz 25 emas, 35 kvadrat ishladi."
{
  const input = 'Aziz 25 emas, 35 kvadrat ishladi.';
  const res = cleanTranscript(input);
  assert.strictEqual(res.cleaned, 'Aziz 25 emas, 35 kvadrat ishladi.');
  assert.strictEqual(res.cleaned.includes('emas'), true);
  assert.strictEqual(res.cleaned.includes('35'), true);
  pass('C4: "Aziz 25 emas, 35 kvadrat ishladi." contrastive correction and both numbers preserved');
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP D: Technical regressions
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- D. TECHNICAL REGRESSION & STREAMING ACCUMULATOR ---');

// D1: Streaming accumulator: Interim results must replace each other, never concatenate
{
  const acc = new StreamingTranscriptAccumulator();
  acc.handleSpeechEvent({
    resultIndex: 0,
    results: [Object.assign([{ transcript: 'Ali' }], { isFinal: false })],
  });
  assert.strictEqual(acc.getFullText(), 'Ali');

  acc.handleSpeechEvent({
    resultIndex: 0,
    results: [Object.assign([{ transcript: 'Ali bugun' }], { isFinal: false })],
  });
  assert.strictEqual(acc.getFullText(), 'Ali bugun'); // Replaced, NOT "Ali Ali bugun"

  acc.handleSpeechEvent({
    resultIndex: 0,
    results: [Object.assign([{ transcript: 'Ali bugun 10 kvadrat' }], { isFinal: false })],
  });
  assert.strictEqual(acc.getFullText(), 'Ali bugun 10 kvadrat');
  pass('D1: Streaming interim results replace preceding interim text without memory leak concatenation');
}

// D2: Duplicate final events commit only once
{
  const acc = new StreamingTranscriptAccumulator();
  acc.handleSpeechEvent({
    resultIndex: 0,
    results: [Object.assign([{ transcript: 'Ali bugun 10 kvadrat ishladi' }], { isFinal: true })],
  });

  // Re-emitted by engine (e.g. repeated finalize event)
  acc.handleSpeechEvent({
    resultIndex: 0,
    results: [Object.assign([{ transcript: 'Ali bugun 10 kvadrat ishladi' }], { isFinal: true })],
  });

  assert.strictEqual(acc.getFullText(), 'Ali bugun 10 kvadrat ishladi');
  pass('D2: Re-emitted identical final events are committed strictly once');
}

// D3: Overlapping audio chunks stitching
{
  const chunk1 = 'Bugun Jamshid 25 kvadrat';
  const chunk2 = '25 kvadrat va Sherzod 18 kvadrat ishladi';
  const merged = mergeOverlappingChunks(chunk1, chunk2);
  assert.strictEqual(merged, 'Bugun Jamshid 25 kvadrat va Sherzod 18 kvadrat ishladi');
  pass('D3: Overlapping audio chunks merged with duplicate overlap stripped seamlessly');
}

// D4: Empty, whitespace, and partial transcripts
{
  const res1 = cleanTranscript('');
  assert.strictEqual(res1.cleaned, '');
  assert.strictEqual(res1.wasCleaned, false);

  const res2 = cleanTranscript('   ');
  assert.strictEqual(res2.cleaned, '');

  const acc = new StreamingTranscriptAccumulator();
  acc.handleSpeechEvent(null);
  assert.strictEqual(acc.getFullText(), '');
  pass('D4: Empty and whitespace transcripts handled safely without crashing');
}

// ─────────────────────────────────────────────────────────────────────────────
// GROUP E: Semantic Guardrails (AI Safety Invariants)
// ─────────────────────────────────────────────────────────────────────────────
console.log('\n--- E. SEMANTIC GUARDRAILS (AI SAFETY INVARIANTS) ---');

const mockWorkers = [
  { id: 'w1', name: 'Jamshid Usta', role: 'usta', dailyRate: 150000, ratePerM2: 20000, status: 'ACTIVE' },
  { id: 'w2', name: 'Sherzod Aliyev', role: 'shogird', dailyRate: 100000, ratePerM2: 15000, status: 'ACTIVE' },
];

// E1: Guardrail rejects invented number
{
  const orig = 'Jamshid 25 kvadrat ishladi';
  const unsafeCand = 'Jamshid 30 kvadrat ishladi'; // 30 is invented
  const check = aiTranscriptCorrectorService.validateCorrection(orig, unsafeCand, mockWorkers);
  assert.strictEqual(check.isValid, false);
  pass('E1: Semantic guardrail rejected hallucinated number mutation (25 -> 30)');
}

// E2: Guardrail rejects stripped negation
{
  const orig = 'Sherzod kelmadi';
  const unsafeCand = 'Sherzod keldi'; // Negation was flipped!
  const check = aiTranscriptCorrectorService.validateCorrection(orig, unsafeCand, mockWorkers);
  assert.strictEqual(check.isValid, false);
  pass('E2: Semantic guardrail rejected stripped negation ("kelmadi" -> "keldi")');
}

// E3: Guardrail rejects worker substitution
{
  const orig = 'Jamshid 25 kvadrat qildi';
  const unsafeCand = 'Sherzod 25 kvadrat qildi'; // Jamshid changed to Sherzod!
  const check = aiTranscriptCorrectorService.validateCorrection(orig, unsafeCand, mockWorkers);
  assert.strictEqual(check.isValid, false);
  pass('E3: Semantic guardrail rejected worker identity substitution');
}

// E4: End-to-end voice orchestrator returns original, cleaned, and wasCleaned
{
  const testInput = 'Ali Ali bugun 10 kvadrat 10 kvadrat ishladi';
  const result = await voiceOrchestratorService.processTextCommand(testInput, 'owner-test-1');
  assert.strictEqual(result.originalTranscript, testInput);
  assert.strictEqual(result.cleanedTranscript, 'Ali bugun 10 kvadrat ishladi');
  assert.strictEqual(result.wasCleaned, true);
  assert.strictEqual(result.transcript, 'Ali bugun 10 kvadrat ishladi');
  pass('E4: Voice Orchestrator end-to-end preserves originalTranscript and cleanedTranscript');
}

console.log('\n================================================================');
console.log(`🎉 ALL ${testsPassed} REGRESSION SCENARIOS PASSED WITH ZERO FAILURES! 🎉`);
console.log('================================================================\n');
