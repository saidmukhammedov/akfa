import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ClayAttendanceToggle } from '../ui/ClayPill';
import { EmptyState } from '../ui/EmptyState';
import {
  Calendar,
  CheckCheck,
  MessageSquare,
  Sparkles,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getTodayDateString } from '@akfa/shared';

export const DavomatView: React.FC = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const {
    activeWorkers,
    attendances,
    selectedDate,
    setSelectedDate,
    markAttendance,
    bulkMarkAttendance,
  } = useAppState();

  const [activeNoteWorkerId, setActiveNoteWorkerId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [showSavedToast, setShowSavedToast] = useState(false);

  const todayStr = getTodayDateString();
  const yesterdayStr = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  })();

  // Quick date switches
  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const pad = (n: number) => String(n).padStart(2, '0');
    setSelectedDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const shiftDate = (offsetDays: number) => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    setSelectedDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const handleToggle = (workerId: string, newStatus: 'PRESENT' | 'ABSENT', isHalf?: boolean) => {
    triggerSavedFeedback();
    markAttendance(workerId, newStatus, undefined, isHalf).catch(() => {
      // Error handled via AppStateContext
    });
  };

  const handleHalfDayToggle = (workerId: string, isHalf: boolean) => {
    triggerSavedFeedback();
    const record = attendances.find(
      (a) => a.workerId === workerId && a.date === selectedDate
    );
    markAttendance(workerId, 'PRESENT', record?.notes || undefined, isHalf).catch(() => {
      // Error handled via AppStateContext
    });
  };

  const handleBulkMarkPresent = () => {
    triggerSavedFeedback();
    bulkMarkAttendance('PRESENT').catch(() => {
      // Error handled via AppStateContext
    });
  };

  const triggerSavedFeedback = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2000);
  };

  const openNoteModal = (workerId: string, currentNote?: string | null) => {
    setActiveNoteWorkerId(workerId);
    setNoteText(currentNote || '');
  };

  const saveNote = async () => {
    if (activeNoteWorkerId) {
      const record = attendances.find(
        (a) => a.workerId === activeNoteWorkerId && a.date === selectedDate
      );
      try {
        await markAttendance(
          activeNoteWorkerId,
          record ? record.status : 'ABSENT',
          noteText.trim() || undefined
        );
        setActiveNoteWorkerId(null);
        setNoteText('');
        triggerSavedFeedback();
      } catch {
        // Error surfaced via AppStateContext
      }
    }
  };

  // Counts for selected date
  const dateAttendances = attendances.filter((a) => a.date === selectedDate);
  const presentCount = dateAttendances.filter((a) => a.status === 'PRESENT' && !a.isHalfDay).length;
  const halfDayCount = dateAttendances.filter((a) => a.status === 'PRESENT' && a.isHalfDay).length;
  const absentCount = dateAttendances.filter((a) => a.status === 'ABSENT').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Sleek Header: Title, Date indicator & Bulk Mark */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
            {t.davomat.title}
          </h2>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline truncate">
            &bull; {formatDate(selectedDate, 'full')}
          </span>
          {showSavedToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-emerald-200/90 dark:border-emerald-800/60 shadow-clay-pill animate-in fade-in duration-100 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              {t.davomat.savedNotification}
            </span>
          )}
        </div>

        {/* 3D Emerald Clay Bulk Action Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBulkMarkPresent}
          className="text-emerald-800 dark:text-emerald-300 bg-gradient-to-b from-white to-emerald-50 dark:from-emerald-950/70 dark:to-emerald-900/50 border-emerald-300 dark:border-emerald-800/80 shadow-clay-btn text-xs font-black shrink-0 h-11 px-4 rounded-2xl"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
          <span className="hidden sm:inline">{t.davomat.markAllPresent}</span>
          <span className="sm:hidden">{t.davomat.present} ✓</span>
        </Button>
      </div>

      {/* Floating Frosted Glass Date Controls & Summary Bar */}
      <div className="glass-clay-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3.5">
        {/* Left: Day switcher & calendar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center glass-slot p-1 rounded-2xl shadow-glass-slot shrink-0">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              title="Oldingi kun"
              className="clay-interactive p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className={`clay-interactive px-3.5 py-1.5 text-xs font-black rounded-xl cursor-pointer whitespace-nowrap ${
                selectedDate === todayStr
                  ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.common.today}
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className={`clay-interactive px-3.5 py-1.5 text-xs font-black rounded-xl cursor-pointer whitespace-nowrap ${
                selectedDate === yesterdayStr
                  ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {t.common.yesterday}
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              title="Keyingi kun"
              className="clay-interactive p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-white/70 dark:bg-slate-850/80 backdrop-blur-md border border-white/90 dark:border-slate-750 rounded-2xl text-xs font-bold shadow-clay-pill shrink-0">
            <Calendar className="w-4 h-4 text-akfa-600 dark:text-blue-400 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 dark:text-white focus:outline-none cursor-pointer [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
        </div>

        {/* Right: Live attendance counters */}
        <div className="flex items-center gap-2 text-xs font-black ml-auto sm:ml-0 flex-wrap">
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-present-50 to-present-100 dark:from-present-950/70 dark:to-present-900/50 text-present-800 dark:text-present-300 border border-present-200/90 dark:border-present-800/60 shadow-clay-pill whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-4 h-4 text-present-600 dark:text-present-400 stroke-[2.5]" />
            <span>{presentCount}</span>
            <span className="text-[11px] font-semibold text-present-700 dark:text-present-400">{t.dashboard.presentRatio}</span>
          </span>
          {halfDayCount > 0 && (
            <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/70 dark:to-amber-900/50 text-amber-800 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60 shadow-clay-pill whitespace-nowrap shrink-0">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 stroke-[2.5]" />
              <span>{halfDayCount}</span>
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400">{t.davomat.halfDay || '0.5 kun'}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-b from-absent-50 to-absent-100 dark:from-absent-950/70 dark:to-absent-900/50 text-absent-800 dark:text-absent-300 border border-absent-200/90 dark:border-absent-800/60 shadow-clay-pill whitespace-nowrap shrink-0">
            <XCircle className="w-4 h-4 text-absent-600 dark:text-absent-400 stroke-[2.5]" />
            <span>{absentCount}</span>
            <span className="text-[11px] font-semibold text-absent-700 dark:text-absent-400">{t.dashboard.absentRatio}</span>
          </span>
        </div>
      </div>

      {/* Workers Attendance List */}
      {activeWorkers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.emptyStates.noWorkers}
          description="Ishchilarni ro'yxatga olish faqat Sozlamalar bo'limida amalga oshiriladi."
        />
      ) : (
        <div className="space-y-3.5">
          {activeWorkers.map((worker) => {
            const record = attendances.find(
              (a) => a.workerId === worker.id && a.date === selectedDate
            );
            const currentStatus = record ? record.status : 'ABSENT';
            const isHalfDay = Boolean(record?.isHalfDay);
            const rateSnapshot = record?.rateSnapshot ?? worker.dailyRate;
            const hasNotes = Boolean(record?.notes);

            return (
              <div
                key={worker.id}
                className="glass-clay-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Worker Information */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="clay-avatar w-12 h-12 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-base flex-shrink-0">
                    {worker.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                        {worker.name}
                      </h4>
                      <Badge role={worker.role} size="sm" />
                      {currentStatus === 'PRESENT' && isHalfDay && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/80 shadow-clay-pill">
                          {t.davomat.halfDay || '0.5 kun'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                      <span className="font-extrabold text-slate-800 dark:text-slate-200">
                        {formatCurrency(rateSnapshot)}
                      </span>
                      <span>&bull;</span>
                      <span>{t.davomat.ratePerDay}</span>
                      {worker.phone && (
                        <>
                          <span className="hidden md:inline">&bull;</span>
                          <span className="hidden md:inline">{worker.phone}</span>
                        </>
                      )}
                    </div>
                    {hasNotes && (
                      <p className="text-xs font-bold text-amber-900 dark:text-amber-300 bg-gradient-to-b from-amber-50 to-amber-100 dark:from-amber-950/50 dark:to-amber-900/40 px-3 py-1 rounded-xl mt-1.5 border border-amber-200/90 dark:border-amber-800/60 inline-block shadow-clay-pill">
                        Izoh: "{record?.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Tactile Controls: Attendance Pill & Note Button */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 shrink-0 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => openNoteModal(worker.id, record?.notes)}
                    className={`clay-interactive p-2.5 sm:p-3 rounded-2xl border transition-all text-xs font-black flex items-center gap-1.5 shadow-clay-pill cursor-pointer shrink-0 ${
                      hasNotes
                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                        : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-white/95 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={t.davomat.addNote}
                  >
                    <MessageSquare className="w-4 h-4 stroke-[2.2]" />
                    <span className="hidden lg:inline">{t.common.notes}</span>
                  </button>

                  <ClayAttendanceToggle
                    status={currentStatus}
                    isHalfDay={isHalfDay}
                    onChange={(newStatus, newHalf) => handleToggle(worker.id, newStatus, newHalf)}
                    onHalfDayToggle={(newHalf) => handleHalfDayToggle(worker.id, newHalf)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Modal (Ultra-Frosted Glass Clay Modal) */}
      {activeNoteWorkerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white/85 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[32px] p-7 max-w-md w-full shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border-2 border-white/90 dark:border-slate-700">
            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1 tracking-tight">
              {t.davomat.addNote}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 font-semibold">
              {activeWorkers.find((w) => w.id === activeNoteWorkerId)?.name} &bull; {formatDate(selectedDate)}
            </p>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.davomat.notePlaceholder}
              className="w-full p-4 text-sm font-semibold bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl border border-white/85 dark:border-slate-700 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 dark:focus:bg-slate-800 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)] mb-5"
              autoFocus
            />
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActiveNoteWorkerId(null);
                  setNoteText('');
                }}
              >
                {t.common.cancel}
              </Button>
              <Button variant="primary" size="sm" onClick={saveNote}>
                {t.common.save}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
