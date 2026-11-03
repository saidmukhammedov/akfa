import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { apiClient } from '../../api/client';
import {
  VoiceProcessResult,
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
} from 'lucide-react';

interface VoiceCommandModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ModalStep = 'RECORDING' | 'PROCESSING' | 'CONFIRMATION' | 'REPORT' | 'CLARIFICATION' | 'SUCCESS';

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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Reset state when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep('RECORDING');
      setIsRecording(false);
      setRecordingSeconds(0);
      setErrorMessage(null);
      setProcessResult(null);
      setManualText('');
      setActiveTabMode('VOICE');
    } else {
      cleanupRecording();
    }
  }, [isOpen]);

  // Clean up media streams and timers
  const cleanupRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Start recording
  const startRecording = async () => {
    setErrorMessage(null);
    audioChunksRef.current = [];

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMessage("Ushbu brauzerda ovoz yozish (MediaRecorder) qo'llab-quvvatlanmaydi.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Select supported audio mimeType
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        await handleAudioUpload(audioBlob);
      };

      recorder.start(250);
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 45) {
            stopRecording();
            return 45;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.error('Microphone error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMessage(t.voice?.permissionDenied || "Mikrofon ruxsati berilmadi. Sozlamalardan mikrofonni yoqing.");
      } else {
        setErrorMessage(`Mikrofonni ochishda xatolik: ${err.message}`);
      }
      setIsRecording(false);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
    setStep('PROCESSING');
  };

  // Upload and process audio
  const handleAudioUpload = async (audioBlob: Blob) => {
    setStep('PROCESSING');
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const audioBase64 = btoa(binary);

      const res = await apiClient.voice.processAudio(audioBase64, audioBlob.type || 'audio/webm');
      handleProcessSuccess(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Ovozni tahlil qilishda xatolik yuz berdi.");
      setStep('RECORDING');
    }
  };

  // Submit manual text command
  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) return;

    setStep('PROCESSING');
    setErrorMessage(null);

    try {
      const res = await apiClient.voice.parseText(manualText.trim());
      handleProcessSuccess(res.data);
    } catch (err: any) {
      setErrorMessage(err.message || "Buyruqni tahlil qilishda xatolik yuz berdi.");
      setStep('RECORDING');
    }
  };

  const handleProcessSuccess = (result: VoiceProcessResult) => {
    setProcessResult(result);

    if (result.needsClarification) {
      setStep('CLARIFICATION');
    } else if (result.requiresConfirmation) {
      setStep('CONFIRMATION');
    } else if (result.report) {
      setStep('REPORT');
    } else {
      setStep('CONFIRMATION');
    }
  };

  // Confirm and execute pending command
  const handleConfirm = async () => {
    if (!processResult?.confirmationToken) return;

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      await apiClient.voice.confirm(processResult.confirmationToken, 'CONFIRM');
      await refreshData();
      setStep('SUCCESS');
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setErrorMessage(err.message || "Buyruqni saqlashda xatolik yuz berdi.");
    } finally {
      setIsConfirming(false);
    }
  };

  // Format timer seconds (MM:SS)
  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.voice?.modalTitle || "O'zbekcha ovozli buyruq"} maxWidth="md">
      <div className="space-y-4">
        {/* Error notification */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 font-bold flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: RECORDING VIEW */}
        {step === 'RECORDING' && (
          <div className="space-y-5">
            {/* Mode switch: Voice vs Text */}
            <div className="flex items-center justify-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
              <button
                type="button"
                onClick={() => setActiveTabMode('VOICE')}
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
                onClick={() => setActiveTabMode('TEXT')}
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
                {/* Audio pulse button */}
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
                    {isRecording ? t.voice?.listening || "Tinglanmoqda..." : t.voice?.startRecording || "Ovoz yozishni boshlash"}
                  </h4>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                    {isRecording
                      ? `Yozilmoqda: ${formatTimer(recordingSeconds)} (to'xtatish uchun bosing)`
                      : t.voice?.speakPrompt || "O'zbek tilida gapiring (masalan: 'Bugun Aziz 25 kvadrat ishladi')"}
                  </p>
                </div>

                {/* Example prompts pill */}
                <div className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-1.5">
                  <span className="font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-akfa-600 dark:text-blue-400" />
                    {t.voice?.examples?.title || "Foydali ovozli buyruq misollari:"}
                  </span>
                  <ul className="text-slate-600 dark:text-slate-400 space-y-1 font-medium pl-1">
                    <li>&bull; {t.voice?.examples?.vol1 || "“Bugun Jamshid 25 kvadrat, Sherzod 18 kvadrat ishladi”"}</li>
                    <li>&bull; {t.voice?.examples?.att1 || "“Bugun Jamshid va Sherzod keldi, Jasur kelmadi”"}</li>
                    <li>&bull; {t.voice?.examples?.rep1 || "“Bugungi hisobotni ko'rsat”"}</li>
                  </ul>
                </div>
              </div>
            ) : (
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
                  <Button type="submit" variant="primary" size="sm" className="rounded-2xl">
                    <Send className="w-3.5 h-3.5" />
                    <span>Yuborish</span>
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* STEP 2: PROCESSING VIEW */}
        {step === 'PROCESSING' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-akfa-600 border-t-transparent animate-spin flex items-center justify-center" />
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {t.voice?.processing || "Ovoz tahlil qilinmoqda..."}
              </h4>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">
                Google Cloud Speech V2 (uz-UZ) va AI buyruqni tekshirmoqda...
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: CONFIRMATION VIEW (MUTATING OPERATIONS) */}
        {step === 'CONFIRMATION' && processResult && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Transcript Quote */}
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 space-y-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-akfa-800 dark:text-blue-300 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-akfa-600 dark:text-blue-400" />
                {t.voice?.transcriptLabel || "Eshitilgan buyruq matni:"}
              </span>
              <p className="text-xs sm:text-sm font-black text-slate-900 dark:text-white italic">
                "{processResult.transcript}"
              </p>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 pt-1">
                <span>Amal: <strong className="text-akfa-700 dark:text-blue-400 uppercase">{t.voice?.intents?.[processResult.intent] || processResult.intent}</strong></span>
                <span>Sana: {formatDate(processResult.date)}</span>
              </div>
            </div>

            {/* Resolved Items List */}
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

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/60 dark:border-slate-800">
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep('RECORDING')}>
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
                {isConfirming ? t.common.loading : t.voice?.confirmAndExecute || "Tasdiqlash va bajarish"}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: REPORT VIEW (READ-ONLY QUERIES) */}
        {step === 'REPORT' && processResult?.report && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
              <span className="text-[11px] font-black uppercase tracking-wider text-akfa-800 dark:text-blue-300">
                "{processResult.transcript}"
              </span>
            </div>

            {/* Daily Report */}
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

            {/* Monthly Report */}
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

            {/* Worker Salary Report */}
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

            {/* Volume Report */}
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

        {/* STEP 5: CLARIFICATION VIEW */}
        {step === 'CLARIFICATION' && processResult && (
          <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900 dark:text-white">
                {t.voice?.clarificationTitle || "Aniqlashtirish talab etiladi"}
              </h4>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-2 px-4">
                {processResult.clarificationMessage}
              </p>
            </div>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={() => setStep('RECORDING')}
              className="rounded-2xl"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              <span>Qaytadan gapirish</span>
            </Button>
          </div>
        )}

        {/* STEP 6: SUCCESS VIEW */}
        {step === 'SUCCESS' && (
          <div className="py-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 flex items-center justify-center animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h4 className="text-base font-black text-slate-900 dark:text-white">
              {t.voice?.successSaved || "Buyruq muvaffaqiyatli bajarildi va saqlandi!"}
            </h4>
          </div>
        )}
      </div>
    </Modal>
  );
};
