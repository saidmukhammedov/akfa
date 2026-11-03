import React, { useState, useMemo } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { EmptyState } from '../ui/EmptyState';
import { VolumeRecord } from '@akfa/shared';
import {
  Layers,
  PlusCircle,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

export const ObyomView: React.FC = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const {
    activeWorkers,
    workers,
    volumes,
    volumeOverview,
    volumeWorkerSummaries,
    selectedDate,
    setSelectedDate,
    addVolumeRecord,
    updateVolumeRecord,
    deleteVolumeRecord,
  } = useAppState();

  // Filter state
  const [filterWorkerId, setFilterWorkerId] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [workerId, setWorkerId] = useState<string>('');
  const [recordDate, setRecordDate] = useState<string>(selectedDate);
  const [squareMeters, setSquareMeters] = useState<string>('');
  const [rateSnapshot, setRateSnapshot] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Day switcher helpers
  const shiftDate = (offsetDays: number) => {
    const parts = selectedDate.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    d.setDate(d.getDate() + offsetDays);
    const pad = (n: number) => String(n).padStart(2, '0');
    setSelectedDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  const setQuickDate = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const pad = (n: number) => String(n).padStart(2, '0');
    setSelectedDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
  };

  // Open Add Modal
  const openAddModal = (targetWorkerId?: string) => {
    setEditingRecordId(null);
    const defaultWorker = targetWorkerId
      ? workers.find((w) => w.id === targetWorkerId)
      : activeWorkers[0] || workers[0];

    const chosenId = defaultWorker?.id || '';
    setWorkerId(chosenId);
    setRecordDate(selectedDate);
    setSquareMeters('');
    setRateSnapshot(defaultWorker?.ratePerM2 ? String(defaultWorker.ratePerM2) : '0');
    setNotes('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (record: VolumeRecord) => {
    setEditingRecordId(record.id);
    setWorkerId(record.workerId);
    setRecordDate(record.date);
    setSquareMeters(String(record.squareMeters));
    setRateSnapshot(String(record.rateSnapshot));
    setNotes(record.notes || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle worker change in modal (automatically sync worker's default ratePerM2)
  const handleWorkerChange = (newWorkerId: string) => {
    setWorkerId(newWorkerId);
    if (!editingRecordId) {
      const selectedW = workers.find((w) => w.id === newWorkerId);
      if (selectedW) {
        setRateSnapshot(String(selectedW.ratePerM2 ?? 0));
      }
    }
  };

  // Calculation preview
  const previewM2 = Number(squareMeters.replace(',', '.'));
  const previewRate = Number(rateSnapshot.replace(/\s/g, ''));
  const previewTotal = !isNaN(previewM2) && !isNaN(previewRate) && previewM2 > 0 && previewRate >= 0
    ? Math.round(previewM2 * previewRate)
    : 0;

  // Handle Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerId) {
      setFormError(t.obyom.selectWorker);
      return;
    }
    const cleanM2 = Number(squareMeters.replace(',', '.'));
    if (isNaN(cleanM2) || cleanM2 <= 0) {
      setFormError("Kvadrat metr 0 dan katta musbat son bo'lishi kerak");
      return;
    }
    const cleanRate = Number(String(rateSnapshot).replace(/\s/g, ''));
    if (isNaN(cleanRate) || cleanRate < 0) {
      setFormError("1 m² narxi manfiy bo'lishi mumkin emas");
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      if (editingRecordId) {
        await updateVolumeRecord(editingRecordId, {
          date: recordDate,
          squareMeters: cleanM2,
          rateSnapshot: cleanRate,
          notes: notes.trim() || undefined,
        });
        showToast(t.obyom.savedSuccess);
      } else {
        await addVolumeRecord({
          workerId,
          date: recordDate,
          squareMeters: cleanM2,
          rateSnapshot: cleanRate,
          notes: notes.trim() || undefined,
        });
        showToast(t.obyom.savedSuccess);
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (record: VolumeRecord) => {
    if (window.confirm(t.obyom.deleteConfirm)) {
      try {
        await deleteVolumeRecord(record.id);
        showToast(t.obyom.deletedSuccess);
      } catch (err: any) {
        alert(err.message || "O'chirishda xatolik yuz berdi");
      }
    }
  };

  // Filtered volume entries for selected date
  const dateEntries = useMemo(() => {
    return volumes.filter((v) => {
      const matchesDate = v.date === selectedDate;
      const matchesWorker = filterWorkerId === 'ALL' || v.workerId === filterWorkerId;
      return matchesDate && matchesWorker;
    });
  }, [volumes, selectedDate, filterWorkerId]);

  // Aggregate totals for selected date view
  const selectedDateTotalM2 = useMemo(() => {
    return dateEntries.reduce((acc, curr) => acc + curr.squareMeters, 0);
  }, [dateEntries]);

  const selectedDateTotalAmount = useMemo(() => {
    return dateEntries.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [dateEntries]);

  const todayM2 = volumeOverview?.todaySquareMeters ?? selectedDateTotalM2;
  const todayAmount = volumeOverview?.todayEarnings ?? selectedDateTotalAmount;
  const monthM2 = volumeOverview?.monthlySquareMeters ?? 0;
  const monthAmount = volumeOverview?.monthlyEarnings ?? 0;
  const allTimeM2 = volumeOverview?.totalSquareMetersAllTime ?? 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight truncate">
              {t.obyom.title}
            </h2>
            {toastMessage && (
              <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-800 dark:text-emerald-300 bg-emerald-100/90 dark:bg-emerald-950/80 backdrop-blur-md px-3.5 py-1 rounded-full border border-emerald-200/90 dark:border-emerald-800/60 shadow-clay-pill animate-in fade-in duration-100 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
                {toastMessage}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">
            {t.obyom.subtitle}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => openAddModal()}
          className="self-start sm:self-auto h-12 px-6 rounded-2xl shadow-clay-btn-primary"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.4]" />
          <span className="font-extrabold">{t.obyom.addVolumeBtn}</span>
        </Button>
      </div>

      {/* 3 Frosted Volumetric Glass-Clay KPI Pods */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Pod 1: Today's Volume */}
        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.obyom.todayVolumeTotal}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/60 dark:to-blue-900/40 border border-blue-200/90 dark:border-blue-800/60 shadow-clay-pill flex items-center justify-center">
              <Layers className="w-5 h-5 text-akfa-600 dark:text-blue-400 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
            {todayM2.toFixed(1)} m²
          </div>
          <div className="flex items-center gap-1.5 text-xs text-present-700 dark:text-present-400 font-extrabold mt-2.5">
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{formatCurrency(todayAmount)} ishbay</span>
          </div>
        </div>

        {/* Pod 2: Monthly Total Volume */}
        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.obyom.monthlyVolumeTotal}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950/60 dark:to-indigo-900/40 border border-indigo-200/90 dark:border-indigo-800/60 shadow-clay-pill flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
            {monthM2.toFixed(1)} m²
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5">
            Joriy oy bo'yicha jami bajarilgan hajm
          </p>
        </div>

        {/* Pod 3: Monthly Volume Earnings */}
        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.obyom.monthlyEarningsTotal}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 border border-emerald-200/90 dark:border-emerald-800/60 shadow-clay-pill flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
            {formatCurrency(monthAmount)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5">
            {t.obyom.allTimeVolumeTotal}: {allTimeM2.toFixed(1)} m²
          </p>
        </div>
      </div>

      {/* Date Switcher & Worker Filter Bar */}
      <div className="glass-clay-card p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3.5">
        {/* Date picker controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center glass-slot p-1 rounded-2xl shadow-glass-slot shrink-0">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="clay-interactive p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-akfa-700 dark:hover:text-white transition-all cursor-pointer"
              title="Oldingi kun"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
            </button>
            <div className="px-3 sm:px-4 py-1 text-xs sm:text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-akfa-600 dark:text-blue-400 stroke-[2.4]" />
              <span>{formatDate(selectedDate, 'medium')}</span>
            </div>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="clay-interactive p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-akfa-700 dark:hover:text-white transition-all cursor-pointer"
              title="Keyingi kun"
            >
              <ChevronRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setQuickDate(0)}
              className="clay-interactive px-3 py-1.5 text-xs font-black rounded-xl bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-slate-700 shadow-sm cursor-pointer"
            >
              Bugun
            </button>
            <button
              type="button"
              onClick={() => setQuickDate(1)}
              className="clay-interactive px-3 py-1.5 text-xs font-black rounded-xl bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border border-white/80 dark:border-slate-700 shadow-sm cursor-pointer"
            >
              Kecha
            </button>
          </div>
        </div>

        {/* Worker filter dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-black text-slate-500 dark:text-slate-400 whitespace-nowrap">
            {t.obyom.workerLabel}:
          </span>
          <select
            value={filterWorkerId}
            onChange={(e) => setFilterWorkerId(e.target.value)}
            className="flex-1 sm:flex-initial px-3.5 py-2 bg-white/70 dark:bg-slate-800/80 backdrop-blur-md border border-white/80 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-akfa-500/20"
          >
            <option value="ALL">Barcha ishchilar</option>
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} ({w.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daily Volume Entries Section */}
      <Card
        title={t.obyom.volumeHistory}
        subtitle={`${formatDate(selectedDate, 'full')} &bull; Jami: ${selectedDateTotalM2.toFixed(1)} m² (${formatCurrency(selectedDateTotalAmount)})`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => openAddModal()}
            className="text-xs font-black rounded-xl gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.4]" />
            <span>{t.obyom.addVolumeBtn}</span>
          </Button>
        }
        padding="none"
      >
        {dateEntries.length === 0 ? (
          <EmptyState
            icon={Layers}
            title={t.obyom.emptyHistory}
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={() => openAddModal()}
                className="rounded-2xl"
              >
                <PlusCircle className="w-4 h-4 stroke-[2.4]" />
                <span>{t.obyom.addVolumeBtn}</span>
              </Button>
            }
          />
        ) : (
          <>
            {/* Mobile Cards View */}
            <div className="block md:hidden p-4 space-y-3">
              {dateEntries.map((record) => {
                const displayName = record.workerName || 'Ishchi';
                return (
                  <div
                    key={record.id}
                    className="p-4 rounded-2xl glass-slot space-y-3 border border-white/70 dark:border-slate-800 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/50 dark:border-slate-800/70">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="clay-avatar w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-sm shrink-0">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                            {displayName}
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                            {formatDate(record.date, 'short')}
                          </p>
                        </div>
                      </div>
                      <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50/90 dark:bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-200/80 dark:border-indigo-800/80 shadow-clay-pill shrink-0">
                        {record.squareMeters.toFixed(1)} m²
                      </span>
                    </div>

                    {/* Calculation Details */}
                    <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                          Stavka
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {formatCurrency(record.rateSnapshot)} / m²
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                          Jami ishbay
                        </span>
                        <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                          {formatCurrency(record.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {record.notes && (
                      <p className="text-xs italic text-slate-600 dark:text-slate-300 bg-slate-100/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-white/50 dark:border-slate-700/60">
                        "{record.notes}"
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/50 dark:border-slate-800/60">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditModal(record)}
                        className="justify-center text-xs font-black py-2 rounded-xl"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.4]" />
                        <span>{t.common.edit}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(record)}
                        className="justify-center text-xs font-black py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />
                        <span>{t.common.delete}</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-200/40 dark:bg-slate-800/60 backdrop-blur-md text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-white/80 dark:border-slate-700">
                  <tr>
                    <th className="py-3.5 px-5">{t.obyom.workerLabel}</th>
                    <th className="py-3.5 px-5">{t.obyom.dateLabel}</th>
                    <th className="py-3.5 px-5">{t.obyom.squareMetersLabel}</th>
                    <th className="py-3.5 px-5">{t.obyom.ratePerM2Label}</th>
                    <th className="py-3.5 px-5">{t.obyom.calculatedTotal}</th>
                    <th className="py-3.5 px-5">{t.obyom.notesLabel}</th>
                    <th className="py-3.5 px-5 text-right">{t.common.actions}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/60 dark:divide-slate-800/80">
                  {dateEntries.map((record) => {
                    const displayName = record.workerName || 'Ishchi';
                    return (
                      <tr
                        key={record.id}
                        className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <span className="font-black text-slate-900 dark:text-white">
                            {displayName}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                          {formatDate(record.date, 'short')}
                        </td>
                        <td className="py-4 px-5 font-black text-indigo-700 dark:text-indigo-400 whitespace-nowrap">
                          {record.squareMeters.toFixed(1)} m²
                        </td>
                        <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-bold whitespace-nowrap">
                          {formatCurrency(record.rateSnapshot)} / m²
                        </td>
                        <td className="py-4 px-5 font-black text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                          {formatCurrency(record.totalAmount)}
                        </td>
                        <td className="py-4 px-5 text-xs text-slate-500 dark:text-slate-400 italic max-w-xs truncate">
                          {record.notes || '—'}
                        </td>
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditModal(record)}
                              className="text-xs font-black rounded-xl p-2"
                              title={t.common.edit}
                            >
                              <Pencil className="w-3.5 h-3.5 stroke-[2.4]" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(record)}
                              className="text-xs font-black rounded-xl p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-100/60 dark:hover:bg-rose-950/40"
                              title={t.common.delete}
                            >
                              <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* Ustalar bo'yicha hajm hisoboti (Worker Volume Breakdown Cards) */}
      <Card
        title={t.obyom.workerSummaryTitle}
        subtitle="Joriy oy uchun barcha ustalar bajargan hajm va hisoblangan ishbay daromadlari"
        padding="none"
      >
        {volumeWorkerSummaries.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold py-8 text-center">
            {t.obyom.emptyWorkers}
          </p>
        ) : (
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {volumeWorkerSummaries.map((summary) => (
              <div
                key={summary.workerId}
                className="p-4 rounded-2xl glass-slot space-y-3.5 border border-white/70 dark:border-slate-800 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/50 dark:border-slate-800/70">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="clay-avatar w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-sm shrink-0">
                        {summary.workerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                          {summary.workerName}
                        </h4>
                        <Badge role={summary.workerRole} size="sm" />
                      </div>
                    </div>
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-xl border border-white/80 dark:border-slate-700 whitespace-nowrap">
                      {formatCurrency(summary.currentRatePerM2)}/m²
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                        Jami m²
                      </span>
                      <span className="font-black text-indigo-700 dark:text-indigo-400 text-sm">
                        {summary.totalSquareMeters.toFixed(1)} m²
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-0.5">
                        Ishbay summa
                      </span>
                      <span className="font-black text-emerald-700 dark:text-emerald-400 text-sm">
                        {formatCurrency(summary.totalVolumeEarnings)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/50 dark:border-slate-800/60 gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {summary.entriesCount} {t.obyom.entriesCount}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openAddModal(summary.workerId)}
                    className="text-xs font-black text-akfa-700 dark:text-blue-400 hover:bg-white/80 dark:hover:bg-slate-800 rounded-xl"
                  >
                    + Hajm qo'shish
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add / Edit Volume Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRecordId ? t.obyom.editVolumeTitle : t.obyom.newVolumeTitle}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-xs sm:text-sm text-rose-800 font-bold flex items-start gap-2.5 shadow-clay-card">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{formError}</span>
            </div>
          )}

          {/* Worker Select */}
          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.obyom.workerLabel}
            </label>
            <select
              value={workerId}
              onChange={(e) => handleWorkerChange(e.target.value)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl border border-white/85 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)]"
              required
            >
              {workers.map((w) => (
                <option key={w.id} value={w.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {w.name} &bull; {w.role} ({formatCurrency(w.ratePerM2 ?? 0)}/m²)
                </option>
              ))}
            </select>
          </div>

          {/* Date Input */}
          <Input
            type="date"
            label={t.obyom.dateLabel}
            value={recordDate}
            onChange={(e) => setRecordDate(e.target.value)}
            required
          />

          {/* Square Meters Input */}
          <div>
            <Input
              type="text"
              label={t.obyom.squareMetersLabel}
              placeholder={t.obyom.squareMetersPlaceholder}
              value={squareMeters}
              onChange={(e) => setSquareMeters(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[5, 10, 15, 20, 25, 30].map((m2) => (
                <button
                  key={m2}
                  type="button"
                  onClick={() => setSquareMeters(String(m2))}
                  className="clay-interactive px-2.5 py-1 text-xs bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-lg font-bold border border-white/80 dark:border-slate-700 cursor-pointer"
                >
                  {m2} m²
                </button>
              ))}
            </div>
          </div>

          {/* Rate Per M2 Snapshot Input */}
          <div>
            <Input
              type="number"
              label={t.obyom.ratePerM2Label}
              placeholder={t.obyom.ratePerM2Placeholder}
              value={rateSnapshot}
              onChange={(e) => setRateSnapshot(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[10000, 15000, 20000, 25000, 30000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setRateSnapshot(String(rate))}
                  className="clay-interactive px-2.5 py-1 text-xs bg-white/70 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 rounded-lg font-bold border border-white/80 dark:border-slate-700 cursor-pointer"
                >
                  {formatCurrency(rate)}
                </button>
              ))}
            </div>
          </div>

          {/* Live Calculation Preview */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/20 border border-emerald-500/20 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-semibold">
              <span>{t.obyom.previewCalculation}:</span>
              <span>
                {previewM2 > 0 ? previewM2 : 0} m² × {formatCurrency(previewRate)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-emerald-500/20">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                {t.obyom.calculatedTotal}:
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 dark:text-emerald-400">
                {formatCurrency(previewTotal)}
              </span>
            </div>
          </div>

          {/* Notes Input */}
          <Input
            label={t.obyom.notesLabel}
            placeholder={t.obyom.notesPlaceholder}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/60 dark:border-slate-800">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="rounded-2xl shadow-clay-btn-primary"
            >
              {isSubmitting ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};