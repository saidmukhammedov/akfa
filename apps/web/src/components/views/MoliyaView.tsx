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
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-workshop-text">{t.moliya.title}</h2>
          <p className="text-xs sm:text-sm text-workshop-muted mt-0.5">{t.moliya.subtitle}</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => openPaymentModal()}
          className="self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.moliya.recordPaymentBtn}</span>
        </Button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-clay p-5 border border-workshop-border shadow-clay-card">
          <div className="flex items-center justify-between text-workshop-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.dashboard.monthlyAccrued}
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-workshop-text truncate">
            {formatCurrency(financeOverview.totalAccruedSalaries)}
          </div>
          <p className="text-[11px] text-workshop-muted mt-1.5">
            Davomat va kunlik stavkalar asosida
          </p>
        </div>

        <div className="bg-white rounded-clay p-5 border border-workshop-border shadow-clay-card">
          <div className="flex items-center justify-between text-workshop-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.dashboard.monthlyPaid}
            </span>
            <Receipt className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-workshop-text truncate">
            {formatCurrency(financeOverview.totalPaymentsDistributed)}
          </div>
          <p className="text-[11px] text-workshop-muted mt-1.5">
            Tarqatilgan ish haqi va avanslar
          </p>
        </div>

        <div className="bg-white rounded-clay p-5 border border-workshop-border shadow-clay-card">
          <div className="flex items-center justify-between text-workshop-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              {t.dashboard.outstandingBalance}
            </span>
            <Wallet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 truncate">
            {formatCurrency(financeOverview.totalPendingBalance)}
          </div>
          <p className="text-[11px] text-workshop-muted mt-1.5">
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
            <thead className="bg-slate-50/80 text-xs font-semibold text-workshop-muted uppercase tracking-wider border-b border-workshop-border">
              <tr>
                <th className="py-3 px-4">{t.moliya.tableWorker}</th>
                <th className="py-3 px-4">{t.moliya.tableDailyRate}</th>
                <th className="py-3 px-4">{t.moliya.tableDaysWorked}</th>
                <th className="py-3 px-4">{t.moliya.tableAccrued}</th>
                <th className="py-3 px-4">{t.moliya.tablePaid}</th>
                <th className="py-3 px-4 text-right">{t.moliya.tableBalance}</th>
                <th className="py-3 px-4 text-right">{t.common.actions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {financeSummaries.map((summary) => {
                const isOverpaid = summary.balanceOwed < 0;
                return (
                  <tr key={summary.workerId} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-workshop-text">{summary.name}</span>
                        <Badge role={summary.role} size="sm" />
                        {summary.status === 'ARCHIVED' && (
                          <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            Arxiv
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatCurrency(summary.currentDailyRate)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {summary.daysWorked} kun
                    </td>
                    <td className="py-3.5 px-4 font-bold text-workshop-text">
                      {formatCurrency(summary.totalAccruedSalary)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {formatCurrency(summary.totalPaid)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {isOverpaid ? (
                        <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          {formatCurrency(Math.abs(summary.balanceOwed))} avans
                        </span>
                      ) : summary.balanceOwed === 0 ? (
                        <span className="text-xs font-medium text-slate-500">
                          0 so'm
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700">
                          {formatCurrency(summary.balanceOwed)}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openPaymentModal(summary.workerId)}
                        className="text-xs font-semibold"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
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
        <div className="divide-y divide-slate-100">
          {payments.map((p) => {
            const methodIcon =
              p.paymentMethod === 'CARD' ? (
                <CreditCard className="w-4 h-4 text-blue-600" />
              ) : p.paymentMethod === 'BANK_TRANSFER' ? (
                <Landmark className="w-4 h-4 text-indigo-600" />
              ) : (
                <Banknote className="w-4 h-4 text-emerald-600" />
              );

            return (
              <div key={p.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm flex-shrink-0">
                    {methodIcon}
                  </div>
                  <div>
                    <h5 className="text-sm font-semibold text-workshop-text">{p.workerName}</h5>
                    <div className="flex items-center gap-2 text-xs text-workshop-muted mt-0.5">
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
                  <span className="text-sm font-extrabold text-akfa-700">
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
        <form onSubmit={handleRecordPayment} className="space-y-4">
          {formError && (
            <div className="p-3.5 rounded-xl bg-absent-50 border border-absent-200 text-xs sm:text-sm text-absent-800 font-medium flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-absent-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{formError}</span>
            </div>
          )}

          {/* Worker Select */}
          <div>
            <label className="block text-xs font-semibold text-workshop-text mb-1.5">
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
              className="w-full px-3.5 py-2.5 bg-white border border-workshop-border rounded-xl text-sm text-workshop-text focus:outline-none focus:ring-2 focus:ring-akfa-500/20 focus:border-akfa-600"
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
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[200000, 500000, 1000000, 1500000].map((quick) => (
                <button
                  key={quick}
                  type="button"
                  onClick={() => setQuickAmount(quick)}
                  className="px-2.5 py-1 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-all"
                >
                  {formatCurrency(quick)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-semibold text-workshop-text mb-1.5">
              {t.moliya.methodLabel}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['CASH', 'CARD', 'BANK_TRANSFER'] as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                    paymentMethod === method
                      ? 'bg-akfa-600 text-white border-akfa-600 shadow-clay-btn'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
