import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../api/client';
import {
  VoiceProcessResult,
  cleanTranscript,
  StreamingTranscriptAccumulator,
} from '@akfa/shared';
import {
  Mic,
  Square,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  FileText,
  Volume2,
  Send,
  RefreshCw,
  Loader2,
  Edit3,
} from 'lucide-react';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'RECORDING' | 'PROCESSING' | 'CONFIRMATION' | 'REPORT' | 'CLARIFICATION' | 'SUCCESS';

// ─── Core fix: determine whether the browser has native Uzbek SpeechRecognition ───
// Use `any` for the constructor type to avoid TS DOM lib version mismatches
const getSpeechRecognitionClass = (): (new () => any) | null => {
  if (typeof window === 'undefined') return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
};

export const VoiceCommandModal: React.FC<VoiceCommandModalProps> = ({ isOpen, onClose }) => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { refreshData } = useAppState();

  const [step, setStep] = useState<ModalStep>('RECORDING');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<VoiceProcessResult | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [manualText, setManualText] = useState('');
  const [activeTabMode, setActiveTabMode] = useState<'VOICE' | 'TEXT'>('VOICE');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState('');
  const [showOriginal, setShowOriginal] = useState(false);

  // Refs – no stale closure problems
  const liveTranscriptRef = useRef('');
  const speechRecognitionRef = useRef<any | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isFinalizedRef = useRef(false); // prevent double-submit
  const accumulatorRef = useRef<StreamingTranscriptAccumulator>(new StreamingTranscriptAccumulator());

  const speechSupported = !!getSpeechRecognitionClass();

  // ─── Cleanup ───────────────────────────────────────────────────────────────
  const cleanupRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.abort(); } catch {}
      speechRecognitionRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setStep('RECORDING');
      setIsRecording(false);
      setRecordingSeconds(0);
      setErrorMessage(null);
      setProcessResult(null);
      setManualText('');
      setLiveTranscript('');
      liveTranscriptRef.current = '';
      isFinalizedRef.current = false;
      setIsEditingTranscript(false);
      setEditedTranscript('');
      setShowOriginal(false);
      accumulatorRef.current.reset();
    } else {
      cleanupRecording();
    }
  }, [isOpen, cleanupRecording]);

  // ─── Process recognized text via backend parseText ─────────────────────────
  const processRecognizedText = useCallback(async (text: string, original?: string) => {
    if (isFinalizedRef.current) return;
    isFinalizedRef.current = true;
    setStep('PROCESSING');
    setIsEditingTranscript(false);
    try {
      const res = await apiClient.voice.parseText(text.trim(), undefined, original || text.trim());
      const result = res.data;
      setProcessResult(result);
      setEditedTranscript(result.cleanedTranscript || result.transcript);
      if (result.needsClarification) {
        setStep('CLARIFICATION');
      } else if (result.requiresConfirmation) {
        setStep('CONFIRMATION');
      } else if (result.report) {
        setStep('REPORT');
      } else {
        setStep('CONFIRMATION');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Ovozni tahlil qilishda xatolik yuz berdi.');
      setStep('RECORDING');
      isFinalizedRef.current = false;
    }
  }, []);

  // ─── Start recording ────────────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    const SpeechRecClass = getSpeechRecognitionClass();
    if (!SpeechRecClass) {
      // No browser speech support – switch user to text mode automatically
      setActiveTabMode('TEXT');
      setErrorMessage(
        "Bu brauzer ovoz tanishni qo'llab-quvvatlamaydi. Iltimos, matnni kiriting."
      );
      return;
    }

    setErrorMessage(null);
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    isFinalizedRef.current = false;
    setRecordingSeconds(0);
    accumulatorRef.current.reset();

    const recognition = new SpeechRecClass();
    recognition.lang = 'uz-UZ';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    speechRecognitionRef.current = recognition;

    // Real-time transcript display using StreamingTranscriptAccumulator
    // Completely eliminates Android WebKit duplicate interim append and boundary loop bugs
    recognition.onresult = (event: any) => {
      const fullText = accumulatorRef.current.handleSpeechEvent(event);
      if (fullText) {
        setLiveTranscript(fullText);
        liveTranscriptRef.current = fullText;
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        setErrorMessage('Mikrofon ruxsati berilmadi. Brauzer sozlamalaridan mikrofonni yoqing.');
        cleanupRecording();
        setStep('RECORDING');
      } else if (event.error === 'no-speech') {
        // Handled gracefully in onend
      } else {
        console.warn('[SpeechRecognition] error:', event.error);
      }
    };

    // ── KEY FIX: onend fires AFTER all results are finalized ──────────────
    recognition.onend = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setIsRecording(false);
      speechRecognitionRef.current = null;

      const rawText = liveTranscriptRef.current.trim();
      if (rawText) {
        const cleaned = cleanTranscript(rawText).cleaned;
        processRecognizedText(cleaned, rawText);
      } else {
        if (!isFinalizedRef.current) {
          setErrorMessage(
            "Ovoz tanilmadi. Qayta urinib ko'ring yoki matnli kiritishdan foydalaning."
          );
          setStep('RECORDING');
        }
      }
    };

    try {
      recognition.start();
      setIsRecording(true);

      // Timer – max 60s then auto-stop
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      setErrorMessage(`Mikrofon xatosi: ${err.message}`);
      setIsRecording(false);
    }
  }, [cleanupRecording, processRecognizedText]);

  // ─── Stop recording (recognition.onend handles the rest) ──────────────────
  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (speechRecognitionRef.current) {
      try {
        // .stop() gracefully finalizes, .abort() discards – we want .stop()
        speechRecognitionRef.current.stop();
      } catch {}
    }
  }, []);

  // ─── Submit manual text command ────────────────────────────────────────────
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;
    setErrorMessage(null);
    isFinalizedRef.current = false;
    await processRecognizedText(manualText.trim());
  };

  // ─── Confirm and execute pending command ───────────────────────────────────
  const handleConfirm = async () => {
    if (!processResult?.confirmationToken) return;
    setIsConfirming(true);
    setErrorMessage(null);
    try {
      await apiClient.voice.confirm(processResult.confirmationToken, 'CONFIRM');
      await refreshData();
      setStep('SUCCESS');
      setTimeout(() => { onClose(); }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || 'Buyruqni saqlashda xatolik yuz berdi.');
    } finally {
      setIsConfirming(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.voice?.modalTitle || "O'zbekcha ovozli buyruq"} maxWidth="md">
      <div className="space-y-4">
        {/* Error banner */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* ── STEP 1: RECORDING ── */}
        {step === 'RECORDING' && (
          <div className="space-y-5">
            {/* Mode tabs */}
            <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTabMode('VOICE')}
                disabled={isRecording}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTabMode === 'VOICE'
                    ? 'bg-white dark:bg-slate-900 text-akfa-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <Mic className="w-3.5 h-3.5" />
                  <span>Ovozli yozish</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => { setActiveTabMode('TEXT'); cleanupRecording(); }}
                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  activeTabMode === 'TEXT'
                    ? 'bg-white dark:bg-slate-900 text-akfa-700 dark:text-blue-400 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Matnli kiritish</span>
                </div>
              </button>
            </div>

            {activeTabMode === 'VOICE' ? (
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                {/* Mic button */}
                <div className="relative flex items-center justify-center">
                  {isRecording && (
                    <>
                      <div className="absolute w-28 h-28 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
                      <div className="absolute w-24 h-24 rounded-full bg-red-500/30 animate-pulse pointer-events-none" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg cursor-pointer ${
                      isRecording
                        ? 'bg-gradient-to-tr from-rose-500 to-red-600 text-white shadow-rose-500/40 scale-105'
                        : 'bg-gradient-to-tr from-akfa-500 to-akfa-600 dark:from-blue-600 dark:to-indigo-600 text-white shadow-blue-500/30 hover:scale-105 active:scale-95'
                    }`}
                  >
                    {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-8 h-8" />}
                  </button>
                </div>

                <div>
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {isRecording
                      ? t.voice?.listening || 'Tinglanmoqda...'
                      : t.voice?.startRecording || 'Ovoz yozishni boshlash'}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {isRecording
                      ? `Yozilmoqda: ${formatTimer(recordingSeconds)} — to'xtatish uchun qizil tugmani bosing`
                      : t.voice?.speakPrompt || "O'zbek tilida gapiring (masalan: 'Bugun Aziz 25 kvadrat ishladi')"}
                  </p>
                </div>

                {/* Live transcript preview */}
                {liveTranscript ? (
                  <div className="w-full text-left p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-xs animate-in fade-in duration-200">
                    <span className="font-bold text-akfa-700 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                      <Volume2 className="w-3.5 h-3.5 text-akfa-600 dark:text-blue-400 animate-pulse" />
                      Eshitilayotgan gap:
                    </span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm italic">
                      "{liveTranscript}"
                    </p>
                  </div>
                ) : (
                  !isRecording && (
                    /* Hint examples – only when not recording */
                    <div className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                      <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-akfa-600 dark:text-blue-400" />
                        {t.voice?.examples?.title || 'Foydali ovozli buyruq misollari:'}
                      </span>
                      <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-medium pl-1">
                        <li>&bull; {t.voice?.examples?.vol1 || '"Bugun Jamshid 25 kvadrat, Sherzod 18 kvadrat ishladi"'}</li>
                        <li>&bull; {t.voice?.examples?.att1 || '"Bugun Jamshid va Sherzod keldi, Jasur kelmadi"'}</li>
                        <li>&bull; {t.voice?.examples?.rep1 || '"Bugungi hisobotni ko\'rsat"'}</li>
                      </ul>
                    </div>
                  )
                )}

                {/* Browser compatibility note */}
                {!speechSupported && (
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold">
                    ⚠️ Ushbu brauzer ovoz tanishni qo'llab-quvvatlamaydi.
                    Iltimos, «Matnli kiritish» bo'limini ishlating.
                  </p>
                )}
              </div>
            ) : (
              /* Text mode */
              <form onSubmit={handleTextSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Buyruq matni (O'zbek tilida)
                  </label>
                  <textarea
                    rows={3}
                    value={manualText}
                    onChange={(e) => setManualText(e.target.value)}
                    placeholder="Masalan: Bugun Jamshid 25 kvadrat, Sherzod 18 kvadrat ishladi"
                    className="w-full p-3.5 text-xs sm:text-sm font-semibold bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl border border-white/85 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06)]"
                    autoFocus
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                    {t.common.cancel}
                  </Button>
                  <Button type="submit" variant="primary" size="sm" className="rounded-2xl" disabled={!manualText.trim()}>
                    <Send className="w-3.5 h-3.5" />
                    <span>Yuborish</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── STEP 2: PROCESSING ── */}
        {step === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="w-12 h-12 text-akfa-600 dark:text-blue-400 animate-spin" />
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {t.voice?.processing || 'Buyruq tahlil qilinmoqda...'}
              </h4>
              {liveTranscript && (
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2 italic">
                  «{liveTranscript}»
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 3: CONFIRMATION ── */}
        {step === 'CONFIRMATION' && processResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-akfa-800 dark:text-blue-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-akfa-600 dark:text-blue-400" />
                  {t.voice?.transcriptLabel || 'Eshitilgan buyruq matni:'}
                </span>

                <div className="flex items-center gap-1.5">
                  {processResult.wasCleaned && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-700/60 shadow-sm">
                      <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Aqlli tozalash
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingTranscript((prev) => !prev);
                      setEditedTranscript(processResult.cleanedTranscript || processResult.transcript);
                    }}
                    className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                    title="Matnni tahrirlash"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-akfa-600 dark:text-blue-400" />
                  </button>
                </div>
              </div>

              {isEditingTranscript ? (
                <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                  <textarea
                    rows={2}
                    value={editedTranscript}
                    onChange={(e) => setEditedTranscript(e.target.value)}
                    className="w-full p-2.5 text-xs font-semibold bg-white dark:bg-slate-800 border border-akfa-300 dark:border-blue-500 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-akfa-500"
                    placeholder="Buyruq matnini to'g'rilang..."
                  />
                  <div className="flex justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditedTranscript(processResult.cleanedTranscript || processResult.transcript);
                        setIsEditingTranscript(false);
                      }}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        isFinalizedRef.current = false;
                        processRecognizedText(editedTranscript.trim(), processResult.originalTranscript);
                      }}
                      disabled={!editedTranscript.trim() || editedTranscript.trim() === (processResult.cleanedTranscript || processResult.transcript)}
                      className="px-3 py-1 text-[11px] font-bold bg-akfa-600 hover:bg-akfa-700 text-white rounded-lg cursor-pointer shadow-sm disabled:opacity-50"
                    >
                      Qayta tahlil qilish
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {showOriginal ? (
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 italic bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/60">
                        "{processResult.originalTranscript || processResult.transcript}"
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowOriginal(false)}
                        className="text-[10px] font-bold text-akfa-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        ← Tozalangan matnni ko'rish
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic">
                        "{processResult.cleanedTranscript || processResult.transcript}"
                      </p>
                      {processResult.wasCleaned && processResult.originalTranscript && (
                        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                            ✓ Takrorlangan so'zlar va diktovka xatolari tozalandi
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowOriginal(true)}
                            className="text-akfa-600 dark:text-blue-400 hover:underline font-bold cursor-pointer"
                          >
                            Asl matnni ko'rish
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1 border-t border-blue-100/60 dark:border-blue-900/40">
                <span>Amal: <strong className="text-akfa-700 dark:text-blue-400 uppercase">{t.voice?.intents?.[processResult.intent] || processResult.intent}</strong></span>
                <span>Sana: {formatDate(processResult.date)}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {t.voice?.affectedWorkers || "Tegishli ishchilar va ma'lumotlar:"}
              </span>
              <div className="max-h-56 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {processResult.items?.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/70 dark:bg-slate-800/80 border border-white/80 dark:border-slate-700 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {item.workerName}
                        </span>
                        <Badge role={item.workerRole} size="sm" />
                      </div>
                      <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                        {item.actionType === 'VOLUME' ? (
                          <span>
                            {item.details.squareMeters} m² &bull; {formatCurrency(item.details.rateSnapshot ?? 0)}/m² ={' '}
                            <strong className="text-emerald-700 dark:text-emerald-400 font-bold">
                              {formatCurrency(item.details.totalAmount ?? 0)}
                            </strong>
                          </span>
                        ) : (
                          <span>
                            Holat:{' '}
                            <strong className={item.details.status === 'PRESENT' ? 'text-emerald-600' : 'text-rose-600'}>
                              {item.details.status === 'PRESENT' ? (item.details.isHalfDay ? '0.5 kun' : 'Keldi') : 'Kelmadi'}
                            </strong>
                          </span>
                        )}
                      </div>
                      {item.warning && (
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                          ⚠️ {item.warning}
                        </p>
                      )}
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/60 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setStep('RECORDING'); isFinalizedRef.current = false; setLiveTranscript(''); liveTranscriptRef.current = ''; }}>
                Qayta gapirish
              </Button>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={isConfirming}
                onClick={handleConfirm}
                className="rounded-2xl shadow-clay-btn-primary px-5 py-2 font-black"
              >
                {isConfirming ? t.common.loading : t.voice?.confirmAndExecute || 'Tasdiqlash va bajarish'}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 4: REPORT ── */}
        {step === 'REPORT' && processResult?.report && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
              <span className="text-[11px] font-black uppercase tracking-wider text-akfa-800 dark:text-blue-300">
                "{processResult.transcript}"
              </span>
            </div>

            {processResult.report.type === 'DAILY_REPORT' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Kelgan ustalar</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      {processResult.report.data.presentCount} / {processResult.report.data.totalActiveWorkers}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Bugungi hajm (m²)</span>
                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                      {processResult.report.data.todayVolumeM2.toFixed(1)} m²
                    </span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/70 flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 uppercase">
                    Bugungi jami hisoblangan:
                  </span>
                  <span className="text-base font-black text-emerald-700 dark:text-emerald-400">
                    {formatCurrency(processResult.report.data.todayTotalEarnings)}
                  </span>
                </div>
              </div>
            )}

            {processResult.report.type === 'MONTHLY_REPORT' && (
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700 flex justify-between">
                  <span>Jami hisoblangan (oylik):</span>
                  <strong className="text-sm font-black text-slate-900 dark:text-white">
                    {formatCurrency(processResult.report.data.totalAccruedSalaries)}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700 flex justify-between">
                  <span>Shundan ishbay (m²):</span>
                  <strong className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {formatCurrency(processResult.report.data.totalVolumeEarnings)} ({processResult.report.data.totalVolumeM2.toFixed(1)} m²)
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-white/80 dark:border-slate-700 flex justify-between">
                  <span>Qoldiq toza qarz:</span>
                  <strong className="text-sm font-black text-amber-600 dark:text-amber-400">
                    {formatCurrency(processResult.report.data.totalPendingBalance)}
                  </strong>
                </div>
              </div>
            )}

            {processResult.report.type === 'WORKER_SALARY' && (
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-white/60 dark:border-slate-700">
                  <span className="text-sm font-black text-slate-900 dark:text-white">
                    {processResult.report.data.workerName}
                  </span>
                  <Badge role={processResult.report.data.workerRole} size="sm" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase block">Ishlagan kuni</span>
                    <span className="font-bold">{processResult.report.data.daysWorked} kun</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700">
                    <span className="text-[10px] text-slate-500 uppercase block">Ishlagan hajmi</span>
                    <span className="font-bold">{processResult.report.data.totalVolumeM2.toFixed(1)} m²</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200/80 flex justify-between items-center">
                  <span className="font-bold text-indigo-900 dark:text-indigo-300">Qoldiq to'lanmagan:</span>
                  <strong className="text-sm font-black text-indigo-700 dark:text-indigo-400">
                    {formatCurrency(processResult.report.data.balanceOwed)}
                  </strong>
                </div>
              </div>
            )}

            {processResult.report.type === 'VOLUME_REPORT' && (
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 flex justify-between items-center">
                  <span className="font-bold text-blue-900 dark:text-blue-300">Jami bajarilgan hajm:</span>
                  <strong className="text-base font-black text-blue-700 dark:text-blue-400">
                    {processResult.report.data.totalSquareMeters.toFixed(1)} m²
                  </strong>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1.5 custom-scrollbar">
                  {processResult.report.data.workerBreakdown.map((wb, idx) => (
                    <div key={idx} className="p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 flex justify-between">
                      <span className="font-semibold">{wb.workerName}</span>
                      <strong className="text-akfa-700 dark:text-blue-400">{wb.squareMeters.toFixed(1)} m² ({formatCurrency(wb.earnings)})</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-white/60 dark:border-slate-800">
              <Button type="button" variant="primary" size="sm" onClick={onClose} className="rounded-xl">
                {t.common.close}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 5: CLARIFICATION ── */}
        {step === 'CLARIFICATION' && processResult && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {t.voice?.clarificationTitle || 'Aniqlashtirish talab etiladi'}
              </h4>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 px-4">
                {processResult.clarificationMessage}
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => { setStep('RECORDING'); isFinalizedRef.current = false; setLiveTranscript(''); liveTranscriptRef.current = ''; }}
              className="rounded-2xl"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Qaytadan gapirish</span>
            </Button>
          </div>
        )}

        {/* ── STEP 6: SUCCESS ── */}
        {step === 'SUCCESS' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {t.voice?.successSaved || 'Buyruq muvaffaqiyatli bajarildi va saqlandi!'}
            </h4>
          </div>
        )}
      </div>
    </Modal>
  );
};
