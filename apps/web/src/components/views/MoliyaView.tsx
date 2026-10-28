import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { PaymentMethod, getTodayDateString } from '@akfa/shared';
import {
  Wallet,
  Receipt,
  PlusCircle,
  TrendingUp,
  CreditCard,
  Banknote,
  Landmark,
  ArrowUpRight,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const MoliyaView: React.FC = () => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const {
    workers,
    payments,
    financeSummaries,
    financeOverview,
    recordPayment,
  } = useAppState();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(getTodayDateString());
  const [notes, setNotes] = useState<string>('');
  const [formError, setFormError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const openPaymentModal = (workerId?: string) => {
    setSelectedWorkerId(workerId || (workers[0]?.id ?? ''));
    // If worker selected, prefill with pending balance if positive
    if (workerId) {
      const summary = financeSummaries.find((s) => s.workerId === workerId);
      if (summary && summary.balanceOwed > 0) {
        setAmount(String(summary.balanceOwed));
      } else {
        setAmount('');
      }
    } else {
      setAmount('');
    }
    setPaymentMethod('CASH');
    setPaymentDate(getTodayDateString());
    setNotes('');
    setFormError('');
    setIsPaymentModalOpen(true);
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAmount = String(amount).replace(/\s/g, '');
    const numAmount = Number(cleanAmount);
    if (!selectedWorkerId) {
      setFormError('Ishchini tanlang');
      return;
    }
    if (!numAmount || isNaN(numAmount) || numAmount <= 0) {
      setFormError("To'lov summasi 0 dan katta bo'lishi kerak");
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      await recordPayment(selectedWorkerId, numAmount, paymentMethod, notes.trim() || undefined);
      setIsPaymentModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "To'lovni kiritishda xatolik yuz berdi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const setQuickAmount = (val: number) => {
    setAmount(String(val));
  };

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.moliya.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">{t.moliya.subtitle}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => openPaymentModal()}
          className="self-start sm:self-auto h-12 px-6 rounded-2xl shadow-clay-btn-primary"
        >
          <PlusCircle className="w-5 h-5 stroke-[2.4]" />
          <span className="font-extrabold">{t.moliya.recordPaymentBtn}</span>
        </Button>
      </div>

      {/* Financial Overview Cards (3 Frosted Glass Pods) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.monthlyAccrued}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 border border-emerald-200/90 dark:border-emerald-800/60 shadow-clay-pill flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
            {formatCurrency(financeOverview.totalAccruedSalaries)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5">
            Davomat va kunlik stavkalar asosida
          </p>
        </div>

        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 dark:bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.monthlyPaid}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 dark:from-sky-950/60 dark:to-sky-900/40 border border-sky-200/90 dark:border-sky-800/60 shadow-clay-pill flex items-center justify-center">
              <Receipt className="w-5 h-5 text-akfa-600 dark:text-blue-400 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white truncate tracking-tight">
            {formatCurrency(financeOverview.totalPaymentsDistributed)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5">
            Tarqatilgan ish haqi va avanslar
          </p>
        </div>

        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/15 dark:bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t.dashboard.outstandingBalance}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 border border-amber-200/90 dark:border-amber-800/60 shadow-clay-pill flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800 dark:text-amber-400 truncate tracking-tight">
            {formatCurrency(financeOverview.totalPendingBalance)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-2.5">
            Ishchilar oldidagi jami to'lanishi kerak bo'lgan qoldiq
          </p>
        </div>
      </div>

      {/* Worker Financial Summaries Card & Table */}
      <Card
        title={t.moliya.title}
        subtitle="Davomat jurnali asosida hisoblangan maoshlar va to'lovlar balansi"
        padding="none"
      >
        {/* Mobile View: High-clarity Claymorphism Worker Cards */}
        <div className="block md:hidden p-4 sm:p-6 space-y-3.5">
          {financeSummaries.map((summary) => {
            const isOverpaid = summary.balanceOwed < 0;
            return (
              <div
                key={summary.workerId}
                className="p-4 rounded-2xl glass-slot space-y-3.5 border border-white/70 dark:border-slate-800 shadow-sm"
              >
                {/* Header: Avatar, Name & Role on Left; Daily Rate Pill on Right */}
                <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/50 dark:border-slate-800/70">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="clay-avatar w-11 h-11 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-base shrink-0">
                      {summary.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-slate-900 dark:text-white truncate leading-tight">
                        {summary.name}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Badge role={summary.role} size="sm" />
                        {summary.status === 'ARCHIVED' && (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200/70 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-slate-700">
                            Arxiv
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Daily Rate Pill */}
                  <div className="shrink-0 text-right px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-slate-800/80 border border-white/80 dark:border-slate-700/80 shadow-sm">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-none">
                      {t.moliya.tableDailyRate}
                    </div>
                    <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 leading-none whitespace-nowrap">
                      {formatCurrency(summary.currentDailyRate)}
                    </div>
                  </div>
                </div>

                {/* 2x2 Financial Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 leading-snug">
                      {t.moliya.tableDaysWorked}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      {summary.daysWorked} kun
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 leading-snug">
                      {t.moliya.tableAccrued}
                    </span>
                    <span className="font-black text-slate-900 dark:text-white text-sm whitespace-nowrap">
                      {formatCurrency(summary.totalAccruedSalary)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 leading-snug">
                      {t.moliya.tablePaid}
                    </span>
                    <span className="font-black text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                      {formatCurrency(summary.totalPaid)}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-white/80 dark:border-slate-700 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-1 leading-snug">
                      {t.moliya.tableBalance}
                    </span>
                    {isOverpaid ? (
                      <span className="font-black text-blue-700 dark:text-blue-300 text-xs whitespace-nowrap">
                        {formatCurrency(Math.abs(summary.balanceOwed))} avans
                      </span>
                    ) : summary.balanceOwed === 0 ? (
                      <span className="font-bold text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap">
                        0 so'm
                      </span>
                    ) : (
                      <span className="font-black text-amber-700 dark:text-amber-400 text-xs whitespace-nowrap">
                        {formatCurrency(summary.balanceOwed)} qarz
                      </span>
                    )}
                  </div>
                </div>

                {/* Full-width Action Button: To'lov berish */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => openPaymentModal(summary.workerId)}
                  className="w-full justify-center py-2.5 rounded-xl text-xs font-black shadow-clay-btn gap-2"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  <span>{t.moliya.recordPaymentBtn}</span>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Desktop / Tablet View: Full Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-200/40 dark:bg-slate-800/60 backdrop-blur-md text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-white/80 dark:border-slate-700">
              <tr>
                <th className="py-3.5 px-5">{t.moliya.tableWorker}</th>
                <th className="py-3.5 px-5">{t.moliya.tableDailyRate}</th>
                <th className="py-3.5 px-5">{t.moliya.tableDaysWorked}</th>
                <th className="py-3.5 px-5">{t.moliya.tableAccrued}</th>
                <th className="py-3.5 px-5">{t.moliya.tablePaid}</th>
                <th className="py-3.5 px-5 text-right">{t.moliya.tableBalance}</th>
                <th className="py-3.5 px-5 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/60 dark:divide-slate-800/80">
              {financeSummaries.map((summary) => {
                const isOverpaid = summary.balanceOwed < 0;
                return (
                  <tr key={summary.workerId} className="hover:bg-white/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-slate-900 dark:text-white">{summary.name}</span>
                        <Badge role={summary.role} size="sm" />
                        {summary.status === 'ARCHIVED' && (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200/70 dark:bg-slate-800 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-300/60 dark:border-slate-700 shadow-clay-pill">
                            Arxiv
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-bold">
                      {formatCurrency(summary.currentDailyRate)}
                    </td>
                    <td className="py-4 px-5 font-black text-slate-900 dark:text-white">
                      {summary.daysWorked} kun
                    </td>
                    <td className="py-4 px-5 font-black text-slate-900 dark:text-white">
                      {formatCurrency(summary.totalAccruedSalary)}
                    </td>
                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-bold">
                      {formatCurrency(summary.totalPaid)}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {isOverpaid ? (
                        <span className="text-xs font-black text-blue-800 dark:text-blue-300 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/60 dark:to-blue-900/40 px-3 py-1 rounded-full border border-blue-200/90 dark:border-blue-800/80 shadow-clay-pill whitespace-nowrap inline-block shrink-0">
                          {formatCurrency(Math.abs(summary.balanceOwed))} avans
                        </span>
                      ) : summary.balanceOwed === 0 ? (
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          0 so'm
                        </span>
                      ) : (
                        <span className="font-black text-amber-800 dark:text-amber-400 whitespace-nowrap">
                          {formatCurrency(summary.balanceOwed)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPaymentModal(summary.workerId)}
                        className="text-xs font-black rounded-xl"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{t.moliya.recordPaymentBtn}</span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Payments Feed */}
      <Card title={t.moliya.paymentHistory} subtitle="Kiritilgan to'lovlar jurnali" padding="none">
        {payments.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold py-8 text-center">
            Hozircha kiritilgan to'lovlar mavjud emas.
          </p>
        ) : (
          <div className="p-4 sm:p-6 space-y-3">
            {payments.map((p) => {
              const methodIcon =
                p.paymentMethod === 'CARD' ? (
                  <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400 stroke-[2.2]" />
                ) : p.paymentMethod === 'BANK_TRANSFER' ? (
                  <Landmark className="w-5 h-5 text-indigo-600 dark:text-indigo-400 stroke-[2.2]" />
                ) : (
                  <Banknote className="w-5 h-5 text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                );

              return (
                <div
                  key={p.id}
                  className="p-3.5 sm:p-4 rounded-2xl glass-slot border border-white/70 dark:border-slate-800 hover:border-white dark:hover:border-slate-700 transition-colors duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  {/* Top row on mobile / Left column on desktop */}
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0 flex-1">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="clay-avatar w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center shrink-0">
                        {methodIcon}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                          {p.workerName}
                        </h5>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                          <span className="whitespace-nowrap font-bold text-slate-700 dark:text-slate-300">
                            {t.paymentMethods[p.paymentMethod]}
                          </span>
                          <span className="hidden sm:inline">&bull;</span>
                          <span className="hidden sm:inline whitespace-nowrap">{formatDate(p.paymentDate, 'medium')}</span>
                          {p.notes && (
                            <>
                              <span className="hidden sm:inline">&bull;</span>
                              <span className="hidden sm:inline italic truncate max-w-xs text-slate-600 dark:text-slate-300">
                                "{p.notes}"
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Amount badge on Mobile (positioned on the right of the header row) */}
                    <div className="sm:hidden text-right shrink-0">
                      <span className="text-xs font-black text-akfa-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/80 px-3.5 py-1.5 rounded-full border border-blue-200/80 dark:border-blue-800/80 shadow-clay-pill whitespace-nowrap inline-block">
                        {formatCurrency(p.amount)}
                      </span>
                    </div>
                  </div>

                  {/* Mobile-only bottom row: Full width for Date and Note so they never wrap awkwardly */}
                  <div className="flex sm:hidden items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold pt-2 border-t border-white/50 dark:border-slate-800/60 gap-2">
                    <span className="whitespace-nowrap flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      {formatDate(p.paymentDate, 'medium')}
                    </span>
                    {p.notes ? (
                      <span className="italic truncate max-w-[170px] text-slate-600 dark:text-slate-300 text-[11px]">
                        "{p.notes}"
                      </span>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-600 text-[10px] font-medium">To'lov saqlandi</span>
                    )}
                  </div>

                  {/* Desktop amount badge */}
                  <div className="hidden sm:block text-right shrink-0">
                    <span className="text-sm font-black text-akfa-700 dark:text-blue-300 bg-blue-50/90 dark:bg-blue-950/80 px-4 py-2 rounded-full border border-blue-200/80 dark:border-blue-800/80 shadow-clay-pill whitespace-nowrap inline-block">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title={t.moliya.newPaymentTitle}
      >
        <form onSubmit={handleRecordPayment} className="space-y-5">
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-xs sm:text-sm text-rose-800 font-bold flex items-start gap-2.5 animate-in fade-in shadow-clay-card">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{formError}</span>
            </div>
          )}

          {/* Worker Select */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              {t.moliya.tableWorker}
            </label>
            <select
              value={selectedWorkerId}
              onChange={(e) => {
                const id = e.target.value;
                setSelectedWorkerId(id);
                const s = financeSummaries.find((sum) => sum.workerId === id);
                if (s && s.balanceOwed > 0) {
                  setAmount(String(s.balanceOwed));
                }
              }}
              className="w-full px-4 py-3 bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl border border-white/85 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 dark:focus:bg-slate-800 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)]"
            >
              {workers.map((w) => {
                const sum = financeSummaries.find((s) => s.workerId === w.id);
                return (
                  <option key={w.id} value={w.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {w.name} ({t.roles[w.role]}) — Qarz: {formatCurrency(sum?.balanceOwed || 0)}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Amount input & Quick chips */}
          <div>
            <Input
              type="number"
              label={t.moliya.amountLabel}
              placeholder={t.moliya.amountPlaceholder}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {[200000, 500000, 1000000, 1500000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setQuickAmount(quick)}
                  className="clay-interactive px-3.5 py-1.5 text-xs bg-gradient-to-b from-white to-slate-100 text-slate-800 rounded-full font-black border border-white shadow-clay-pill transition-all cursor-pointer"
                >
                  {formatCurrency(quick)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method Segmented Switcher */}
          <div>
            <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              {t.moliya.methodLabel}
            </label>
            <div className="p-1.5 glass-slot rounded-2xl grid grid-cols-3 gap-2 shadow-glass-slot">
              {(['CASH', 'CARD', 'BANK_TRANSFER'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`clay-interactive py-2.5 px-3 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    paymentMethod === method
                      ? 'bg-gradient-to-b from-akfa-500 to-akfa-600 text-white shadow-clay-btn-primary border border-akfa-400/50'
                      : 'text-slate-600 hover:text-slate-900 font-bold'
                  }`}
                >
                  {t.paymentMethods[method]}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Date */}
          <Input
            type="date"
            label={t.moliya.paymentDateLabel}
            value={paymentDate}
            onChange={(e) => setPaymentDate(e.target.value)}
            required
          />

          {/* Notes */}
          <Input
            type="text"
            label={t.common.notes}
            placeholder="Izoh (masalan: avans yoki oylik hisob-kitob)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/60">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting} className="rounded-2xl">
              {isSubmitting ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
