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
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t.moliya.title}</h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">{t.moliya.subtitle}</p>
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
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.dashboard.monthlyAccrued}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-200/90 shadow-clay-pill flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 truncate tracking-tight">
            {formatCurrency(financeOverview.totalAccruedSalaries)}
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2.5">
            Davomat va kunlik stavkalar asosida
          </p>
        </div>

        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.dashboard.monthlyPaid}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-50 to-sky-100 border border-sky-200/90 shadow-clay-pill flex items-center justify-center">
              <Receipt className="w-5 h-5 text-akfa-600 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 truncate tracking-tight">
            {formatCurrency(financeOverview.totalPaymentsDistributed)}
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2.5">
            Tarqatilgan ish haqi va avanslar
          </p>
        </div>

        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.dashboard.outstandingBalance}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/90 shadow-clay-pill flex items-center justify-center">
              <Wallet className="w-5 h-5 text-amber-600 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800 truncate tracking-tight">
            {formatCurrency(financeOverview.totalPendingBalance)}
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-2.5">
            Ishchilar oldidagi jami to'lanishi kerak bo'lgan qoldiq
          </p>
        </div>
      </div>

      {/* Worker Financial Summaries Table */}
      <Card
        title={t.moliya.title}
        subtitle="Davomat jurnali asosida hisoblangan maoshlar va to'lovlar balansi"
        padding="none"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-200/40 backdrop-blur-md text-xs font-black text-slate-600 uppercase tracking-wider border-b border-white/80">
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
            <tbody className="divide-y divide-white/60">
              {financeSummaries.map((summary) => {
                const isOverpaid = summary.balanceOwed < 0;
                return (
                  <tr key={summary.workerId} className="hover:bg-white/50 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-black text-slate-900">{summary.name}</span>
                        <Badge role={summary.role} size="sm" />
                        {summary.status === 'ARCHIVED' && (
                          <span className="text-[10px] font-black text-slate-500 bg-slate-200/70 backdrop-blur-md px-2 py-0.5 rounded-full border border-slate-300/60 shadow-clay-pill">
                            Arxiv
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-bold">
                      {formatCurrency(summary.currentDailyRate)}
                    </td>
                    <td className="py-4 px-5 font-black text-slate-900">
                      {summary.daysWorked} kun
                    </td>
                    <td className="py-4 px-5 font-black text-slate-900">
                      {formatCurrency(summary.totalAccruedSalary)}
                    </td>
                    <td className="py-4 px-5 text-slate-600 font-bold">
                      {formatCurrency(summary.totalPaid)}
                    </td>
                    <td className="py-4 px-5 text-right">
                      {isOverpaid ? (
                        <span className="text-xs font-black text-blue-800 bg-gradient-to-b from-blue-50 to-blue-100 px-3 py-1 rounded-full border border-blue-200/90 shadow-clay-pill">
                          {formatCurrency(Math.abs(summary.balanceOwed))} avans
                        </span>
                      ) : summary.balanceOwed === 0 ? (
                        <span className="text-xs font-bold text-slate-500">
                          0 so'm
                        </span>
                      ) : (
                        <span className="font-black text-amber-800">
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
        <div className="divide-y divide-white/60">
          {payments.map((p) => {
            const methodIcon =
              p.paymentMethod === 'CARD' ? (
                <CreditCard className="w-5 h-5 text-blue-600 stroke-[2.2]" />
              ) : p.paymentMethod === 'BANK_TRANSFER' ? (
                <Landmark className="w-5 h-5 text-indigo-600 stroke-[2.2]" />
              ) : (
                <Banknote className="w-5 h-5 text-emerald-600 stroke-[2.2]" />
              );

            return (
              <div key={p.id} className="p-4 sm:p-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="clay-avatar w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0">
                    {methodIcon}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-slate-900">{p.workerName}</h5>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
                      <span>{formatDate(p.paymentDate, 'medium')}</span>
                      <span>&bull;</span>
                      <span>{t.paymentMethods[p.paymentMethod]}</span>
                      {p.notes && (
                        <>
                          <span>&bull;</span>
                          <span className="italic">"{p.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-akfa-700 bg-blue-50/80 px-3.5 py-1.5 rounded-full border border-blue-200/70 shadow-clay-pill">
                    {formatCurrency(p.amount)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
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
              className="w-full px-4 py-3 bg-white/60 backdrop-blur-xl border border-white/85 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)]"
            >
              {workers.map((w) => {
                const sum = financeSummaries.find((s) => s.workerId === w.id);
                return (
                  <option key={w.id} value={w.id}>
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
