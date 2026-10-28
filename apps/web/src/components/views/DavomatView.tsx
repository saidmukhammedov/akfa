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

  const handleToggle = (workerId: string, newStatus: 'PRESENT' | 'ABSENT') => {
    triggerSavedFeedback();
    markAttendance(workerId, newStatus).catch(() => {
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
  const presentCount = dateAttendances.filter((a) => a.status === 'PRESENT').length;
  const absentCount = dateAttendances.filter((a) => a.status === 'ABSENT').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Sleek Header: Title, Date indicator & Bulk Mark */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight truncate">
            {t.davomat.title}
          </h2>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline truncate">
            &bull; {formatDate(selectedDate, 'full')}
          </span>
          {showSavedToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 bg-emerald-100/90 backdrop-blur-md px-3.5 py-1 rounded-full border border-emerald-200/90 shadow-clay-pill animate-in fade-in duration-100 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
              {t.davomat.savedNotification}
            </span>
          )}
        </div>

        {/* 3D Emerald Clay Bulk Action Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBulkMarkPresent}
          className="text-emerald-800 bg-gradient-to-b from-white to-emerald-50 border-emerald-300 shadow-clay-btn text-xs font-black shrink-0 h-11 px-4 rounded-2xl"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
          <span className="hidden sm:inline">{t.davomat.markAllPresent}</span>
          <span className="sm:hidden">{t.davomat.present} ✓</span>
        </Button>
      </div>

      {/* Floating Frosted Glass Date Controls & Summary Bar */}
      <div className="glass-clay-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3.5">
        {/* Left: Day switcher & calendar */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center glass-slot p-1 rounded-2xl shadow-glass-slot">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              title="Oldingi kun"
              className="clay-interactive p-2 text-slate-500 hover:text-slate-900 rounded-xl cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className={`clay-interactive px-3.5 py-1.5 text-xs font-black rounded-xl cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-white text-akfa-700 shadow-clay-card border border-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.common.today}
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className={`clay-interactive px-3.5 py-1.5 text-xs font-black rounded-xl cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-white text-akfa-700 shadow-clay-card border border-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.common.yesterday}
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              title="Keyingi kun"
              className="clay-interactive p-2 text-slate-500 hover:text-slate-900 rounded-xl cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center gap-2 px-3.5 py-2 bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl text-xs font-bold shadow-clay-pill">
            <Calendar className="w-4 h-4 text-akfa-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Live attendance counters */}
        <div className="flex items-center gap-2.5 text-xs font-black ml-auto sm:ml-0">
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-present-50 to-present-100 text-present-800 border border-present-200/90 shadow-clay-pill">
            <CheckCircle2 className="w-4 h-4 text-present-600 stroke-[2.5]" />
            <span>{presentCount}</span>
            <span className="text-[11px] font-semibold text-present-700">{t.dashboard.presentRatio}</span>
          </span>
          <span className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-b from-absent-50 to-absent-100 text-absent-800 border border-absent-200/90 shadow-clay-pill">
            <XCircle className="w-4 h-4 text-absent-600 stroke-[2.5]" />
            <span>{absentCount}</span>
            <span className="text-[11px] font-semibold text-absent-700">{t.dashboard.absentRatio}</span>
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
            const rateSnapshot = record?.rateSnapshot ?? worker.dailyRate;
            const hasNotes = Boolean(record?.notes);

            return (
              <div
                key={worker.id}
                className="glass-clay-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
              >
                {/* Worker Information */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className="clay-avatar w-12 h-12 rounded-2xl flex items-center justify-center font-black text-slate-800 text-base flex-shrink-0">
                    {worker.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="text-base font-black text-slate-900 truncate">
                        {worker.name}
                      </h4>
                      <Badge role={worker.role} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-1">
                      <span className="font-extrabold text-slate-800">
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
                      <p className="text-xs font-bold text-amber-900 bg-gradient-to-b from-amber-50 to-amber-100 px-3 py-1 rounded-xl mt-1.5 border border-amber-200/90 inline-block shadow-clay-pill">
                        Izoh: "{record?.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Tactile Controls: Attendance Pill & Note Button */}
                <div className="flex items-center justify-end gap-3 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => openNoteModal(worker.id, record?.notes)}
                    className={`clay-interactive p-3 rounded-2xl border transition-all text-xs font-black flex items-center gap-1.5 shadow-clay-pill cursor-pointer ${
                      hasNotes
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-white/80 text-slate-600 border-white/95 hover:bg-white hover:text-slate-900'
                    }`}
                    title={t.davomat.addNote}
                  >
                    <MessageSquare className="w-4 h-4 stroke-[2.2]" />
                    <span className="hidden lg:inline">{t.common.notes}</span>
                  </button>

                  <ClayAttendanceToggle
                    status={currentStatus}
                    onChange={(newStatus) => handleToggle(worker.id, newStatus)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note Modal (Ultra-Frosted Glass Clay Modal) */}
      {activeNoteWorkerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white/85 backdrop-blur-3xl rounded-[32px] p-7 max-w-md w-full shadow-[0_25px_60px_-15px_rgba(15,23,42,0.25)] border-2 border-white/90">
            <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">
              {t.davomat.addNote}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              {activeWorkers.find((w) => w.id === activeNoteWorkerId)?.name} &bull; {formatDate(selectedDate)}
            </p>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.davomat.notePlaceholder}
              className="w-full p-4 text-sm font-semibold bg-white/60 backdrop-blur-xl border border-white/85 rounded-2xl focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)] mb-5"
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
