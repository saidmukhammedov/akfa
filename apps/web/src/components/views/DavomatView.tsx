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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Sleek Header: Title, Date indicator & Bulk Mark */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-lg sm:text-xl font-extrabold text-workshop-text tracking-tight truncate">
            {t.davomat.title}
          </h2>
          <span className="text-xs font-semibold text-workshop-muted hidden sm:inline truncate">
            &bull; {formatDate(selectedDate, 'full')}
          </span>
          {showSavedToast && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 bg-emerald-100/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-200/80 shadow-clay-sm animate-in fade-in duration-100 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              {t.davomat.savedNotification}
            </span>
          )}
        </div>

        {/* Quick bulk action button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBulkMarkPresent}
          className="text-emerald-700 bg-white/80 backdrop-blur-md hover:bg-white border-emerald-200/90 shadow-clay-card text-xs font-bold shrink-0 h-10 px-3.5 rounded-2xl"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">{t.davomat.markAllPresent}</span>
          <span className="sm:hidden">{t.davomat.present} ✓</span>
        </Button>
      </div>

      {/* Compact Controls & Summary Bar (Glassclay Capsule) */}
      <div className="bg-white/75 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/80 p-2 sm:p-2.5 shadow-clay-card flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Day switcher & calendar */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center bg-slate-200/50 backdrop-blur-md p-1 rounded-2xl border border-white/70 shadow-inner">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              title="Oldingi kun"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-white/95 text-akfa-700 shadow-clay-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.common.today}
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className={`px-3 py-1 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-white/95 text-akfa-700 shadow-clay-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.common.yesterday}
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              title="Keyingi kun"
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-xl transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/60 backdrop-blur-md border border-white/80 rounded-xl text-xs shadow-clay-sm">
            <Calendar className="w-3.5 h-3.5 text-akfa-600 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-workshop-text focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Live attendance counters */}
        <div className="flex items-center gap-2 text-xs font-bold ml-auto sm:ml-0">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/85 backdrop-blur-md text-present-700 border border-present-200/80 shadow-clay-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-present-600" />
            <span>{presentCount}</span>
            <span className="text-[11px] font-medium text-present-600">{t.dashboard.presentRatio}</span>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50/85 backdrop-blur-md text-absent-700 border border-rose-200/80 shadow-clay-sm">
            <XCircle className="w-3.5 h-3.5 text-absent-600" />
            <span>{absentCount}</span>
            <span className="text-[11px] font-medium text-absent-600">{t.dashboard.absentRatio}</span>
          </span>
        </div>
      </div>

      {/* Workers Attendance List - The Primary Visual Focus */}
      {activeWorkers.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t.emptyStates.noWorkers}
          description="Ishchilarni ro'yxatga olish faqat Sozlamalar bo'limida amalga oshiriladi."
        />
      ) : (
        <div className="space-y-3">
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
                className="bg-white/75 backdrop-blur-xl p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-white/80 shadow-clay-card hover:shadow-clay-card-hover transition-all duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
              >
                {/* Worker Information */}
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white to-slate-100 border border-white/90 shadow-clay-sm flex items-center justify-center font-extrabold text-slate-800 text-sm flex-shrink-0">
                    {worker.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-bold text-workshop-text truncate">
                        {worker.name}
                      </h4>
                      <Badge role={worker.role} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-workshop-muted font-medium mt-0.5">
                      <span className="font-bold text-slate-700">
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
                      <p className="text-xs font-semibold text-amber-800 bg-amber-50/90 backdrop-blur-md px-2.5 py-0.5 rounded-lg mt-1 border border-amber-200/80 inline-block shadow-clay-sm">
                        Izoh: "{record?.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Tactile Controls: Attendance Pill & Note Button */}
                <div className="flex items-center justify-end gap-2.5 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => openNoteModal(worker.id, record?.notes)}
                    className={`p-2.5 rounded-2xl border transition-all text-xs font-bold flex items-center gap-1.5 shadow-clay-sm active:scale-95 cursor-pointer ${
                      hasNotes
                        ? 'bg-amber-50/90 backdrop-blur-md text-amber-800 border-amber-300'
                        : 'bg-white/80 backdrop-blur-md text-slate-600 border-white/90 hover:bg-white hover:text-slate-900'
                    }`}
                    title={t.davomat.addNote}
                  >
                    <MessageSquare className="w-4 h-4" />
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

      {/* Note Modal (Frosted Glass Clay Modal) */}
      {activeNoteWorkerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-white/90 backdrop-blur-2xl rounded-3xl p-6 max-w-md w-full shadow-2xl border border-white/90">
            <h3 className="text-base font-extrabold text-workshop-text mb-1 tracking-tight">
              {t.davomat.addNote}
            </h3>
            <p className="text-xs text-workshop-muted mb-4 font-medium">
              {activeWorkers.find((w) => w.id === activeNoteWorkerId)?.name} — {formatDate(selectedDate)}
            </p>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.davomat.notePlaceholder}
              className="w-full p-3.5 text-sm font-medium bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-akfa-500/15 focus:border-akfa-500 focus:bg-white/95 transition-all shadow-inner mb-5"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2.5">
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
