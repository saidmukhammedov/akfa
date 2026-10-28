import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { TabId } from '../layout/Navigation';
import {
  Users,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Receipt,
  Clock,
  CalendarCheck,
  CreditCard,
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: TabId) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { t, formatCurrency, formatDate } = useLanguage();
  const { owner } = useAuth();
  const {
    activeWorkers,
    attendances,
    payments,
    selectedDate,
    financeOverview,
  } = useAppState();

  // Today's attendance counts
  const todaysAttendance = attendances.filter((a) => a.date === selectedDate);
  const presentCount = todaysAttendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = todaysAttendance.filter((a) => a.status === 'ABSENT').length;
  const totalWorkers = activeWorkers.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Greeting & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-workshop-text tracking-tight">
            {t.dashboard.welcome}, {owner?.fullName || ''}
          </h2>
          <p className="text-xs sm:text-sm text-workshop-muted mt-0.5">
            {owner?.workshopName || t.app.title} — {formatDate(selectedDate, 'full')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:items-center sm:gap-3">
          <Button
            variant="primary"
            onClick={() => onNavigate('davomat')}
            className="h-11 sm:h-11 px-4 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-clay-btn-primary transition-all active:scale-[0.98] w-full sm:w-auto"
          >
            <CalendarCheck className="w-4 h-4 shrink-0 text-white" />
            <span className="truncate">{t.dashboard.quickDavomatBtn}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('moliya')}
            className="h-11 sm:h-11 px-4 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-clay-card border border-white/90 transition-all active:scale-[0.98] w-full sm:w-auto"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-slate-700" />
            <span className="truncate">{t.dashboard.quickPaymentBtn}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid (Frosted Glass + Clay Elevation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance card */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-clay-card hover:shadow-clay-card-hover transition-all duration-200">
          <div className="flex items-center justify-between text-workshop-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.todayAttendance}
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50/80 border border-blue-200/60 shadow-clay-sm flex items-center justify-center">
              <Users className="w-4 h-4 text-akfa-600" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-workshop-text">
              {presentCount} / {totalWorkers}
            </span>
            <span className="text-xs text-present-600 font-bold">
              {t.dashboard.presentRatio}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1 text-present-700 font-semibold bg-present-50/70 px-2 py-0.5 rounded-full border border-present-200/60 shadow-clay-sm">
              <CheckCircle2 className="w-3.5 h-3.5 text-present-600" />
              {presentCount} {t.davomat.present}
            </span>
            <span className="flex items-center gap-1 text-absent-700 font-semibold bg-absent-50/70 px-2 py-0.5 rounded-full border border-absent-200/60 shadow-clay-sm">
              <XCircle className="w-3.5 h-3.5 text-absent-600" />
              {absentCount} {t.davomat.absent}
            </span>
          </div>
        </div>

        {/* Accrued Payroll */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-clay-card hover:shadow-clay-card-hover transition-all duration-200">
          <div className="flex items-center justify-between text-workshop-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.monthlyAccrued}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50/80 border border-emerald-200/60 shadow-clay-sm flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-workshop-text truncate">
            {formatCurrency(financeOverview.totalAccruedSalaries)}
          </div>
          <p className="text-[11px] text-workshop-muted mt-2 font-medium">
            Davomat va kunlik stavkalar asosida
          </p>
        </div>

        {/* Paid Salaries */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-clay-card hover:shadow-clay-card-hover transition-all duration-200">
          <div className="flex items-center justify-between text-workshop-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.monthlyPaid}
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50/80 border border-sky-200/60 shadow-clay-sm flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-workshop-text truncate">
            {formatCurrency(financeOverview.totalPaymentsDistributed)}
          </div>
          <p className="text-[11px] text-workshop-muted mt-2 font-medium">
            {payments.length} ta kiritilgan to'lov
          </p>
        </div>

        {/* Pending Balance Owed to Workers */}
        <div className="bg-white/75 backdrop-blur-xl rounded-3xl p-5 border border-white/80 shadow-clay-card hover:shadow-clay-card-hover transition-all duration-200">
          <div className="flex items-center justify-between text-workshop-muted mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {t.dashboard.outstandingBalance}
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50/80 border border-amber-200/60 shadow-clay-sm flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 truncate">
            {formatCurrency(financeOverview.totalPendingBalance)}
          </div>
          <p className="text-[11px] text-workshop-muted mt-2 font-medium">
            Ishchilar oldidagi joriy qarz
          </p>
        </div>
      </div>

      {/* Two Column Section: Quick Attendance Status & Recent Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Worker Status */}
        <Card
          title={t.dashboard.todayAttendance}
          subtitle={`${formatDate(selectedDate, 'medium')}`}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('davomat')}
              className="text-akfa-600 font-bold"
            >
              {t.davomat.title} &rarr;
            </Button>
          }
        >
          <div className="divide-y divide-slate-200/40">
            {activeWorkers.map((worker) => {
              const record = todaysAttendance.find((a) => a.workerId === worker.id);
              const isPresent = record?.status === 'PRESENT';

              return (
                <div key={worker.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-workshop-text truncate">
                        {worker.name}
                      </p>
                      <Badge role={worker.role} size="sm" />
                    </div>
                    <p className="text-xs text-workshop-muted font-medium mt-0.5">
                      {formatCurrency(worker.dailyRate)} / {t.davomat.ratePerDay}
                    </p>
                  </div>
                  <div>
                    {isPresent ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-present-700 bg-present-50/85 backdrop-blur-md px-3 py-1 rounded-full border border-present-200/80 shadow-clay-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-present-600" />
                        {t.davomat.present}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-absent-700 bg-absent-50/85 backdrop-blur-md px-3 py-1 rounded-full border border-absent-200/80 shadow-clay-sm">
                        <XCircle className="w-3.5 h-3.5 text-absent-600" />
                        {t.davomat.absent}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Recent Payments Feed */}
        <Card
          title={t.dashboard.recentActivity}
          subtitle={t.moliya.paymentHistory}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('moliya')}
              className="text-akfa-600 font-bold"
            >
              {t.moliya.title} &rarr;
            </Button>
          }
        >
          <div className="divide-y divide-slate-200/40">
            {payments.slice(0, 4).map((payment) => (
              <div key={payment.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-workshop-text truncate">
                    {payment.workerName || 'Ishchi'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-workshop-muted font-medium mt-0.5">
                    <span>{formatDate(payment.paymentDate, 'short')}</span>
                    <span>&bull;</span>
                    <span>{t.paymentMethods[payment.paymentMethod]}</span>
                    {payment.notes && (
                      <>
                        <span>&bull;</span>
                        <span className="truncate italic">"{payment.notes}"</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-sm font-extrabold text-akfa-700">
                    {formatCurrency(payment.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
