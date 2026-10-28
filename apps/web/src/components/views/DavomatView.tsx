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
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* Sleek Header: Title, Date indicator & Bulk Mark */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-workshop-text tracking-tight truncate">
            {t.davomat.title}
          </h2>
          <span className="text-xs font-medium text-workshop-muted hidden sm:inline truncate">
            &bull; {formatDate(selectedDate, 'full')}
          </span>
          {showSavedToast && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full animate-in fade-in duration-100 shrink-0">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              {t.davomat.savedNotification}
            </span>
          )}
        </div>

        {/* Quick bulk action button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={handleBulkMarkPresent}
          className="text-emerald-700 hover:bg-emerald-50 border-emerald-200/90 shadow-clay-sm text-xs font-semibold shrink-0 h-9 px-3"
        >
          <CheckCheck className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">{t.davomat.markAllPresent}</span>
          <span className="sm:hidden">{t.davomat.present} ✓</span>
        </Button>
      </div>

      {/* Compact Controls & Summary Bar */}
      <div className="bg-white rounded-2xl border border-workshop-border p-2 sm:p-2.5 shadow-clay-card flex flex-wrap items-center justify-between gap-2.5">
        {/* Left: Day switcher & calendar */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="inline-flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              title="Oldingi kun"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedDate === todayStr
                  ? 'bg-white text-akfa-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.common.today}
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedDate === yesterdayStr
                  ? 'bg-white text-akfa-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.common.yesterday}
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              title="Keyingi kun"
              className="p-1 text-slate-500 hover:text-slate-800 hover:bg-white rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-medium text-workshop-text focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Right: Live attendance counters */}
        <div className="flex items-center gap-2 text-xs font-semibold ml-auto sm:ml-0">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-present-700 border border-emerald-200/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-present-600" />
            <span>{presentCount}</span>
            <span className="text-[11px] font-normal text-present-600">{t.dashboard.presentRatio}</span>
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-absent-700 border border-rose-200/60">
            <XCircle className="w-3.5 h-3.5 text-absent-600" />
            <span>{absentCount}</span>
            <span className="text-[11px] font-normal text-absent-600">{t.dashboard.absentRatio}</span>
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
        <div className="space-y-2.5">
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
                className="bg-white p-3.5 sm:p-4 rounded-clay border border-workshop-border shadow-clay-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-300 transition-all"
              >
                {/* Worker Information */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shadow-clay-sm flex-shrink-0">
                    {worker.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-semibold text-workshop-text truncate">
                        {worker.name}
                      </h4>
                      <Badge role={worker.role} size="sm" />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-workshop-muted mt-0.5">
                      <span className="font-semibold text-slate-700">
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
                      <p className="text-xs text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md mt-1 border border-amber-200/60 inline-block">
                        Izoh: "{record?.notes}"
                      </p>
                    )}
                  </div>
                </div>

                {/* Tactile Controls: Attendance Pill & Note Button */}
                <div className="flex items-center justify-end gap-2 pt-1 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => openNoteModal(worker.id, record?.notes)}
                    className={`p-2 rounded-xl border transition-all text-xs flex items-center gap-1 ${
                      hasNotes
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
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

      {/* Note Modal */}
      {activeNoteWorkerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-100">
          <div className="bg-white rounded-clay p-5 max-w-md w-full shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-workshop-text mb-1">
              {t.davomat.addNote}
            </h3>
            <p className="text-xs text-workshop-muted mb-3">
              {activeWorkers.find((w) => w.id === activeNoteWorkerId)?.name} — {formatDate(selectedDate)}
            </p>
            <textarea
              rows={3}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={t.davomat.notePlaceholder}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-akfa-500/20 focus:border-akfa-600 mb-4"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2">
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
