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
  ArrowRight,
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
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* Top Greeting & Action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {t.dashboard.welcome}, {owner?.fullName || 'Ustaxona Rahbari'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-semibold mt-1">
            {owner?.workshopName || t.app.title} &bull; {formatDate(selectedDate, 'full')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3.5">
          <Button
            variant="primary"
            onClick={() => onNavigate('davomat')}
            className="h-12 sm:h-12 px-5 text-xs sm:text-sm font-extrabold rounded-2xl flex items-center justify-center gap-2.5 w-full sm:w-auto"
          >
            <CalendarCheck className="w-4 h-4 shrink-0 text-white stroke-[2.4]" />
            <span className="truncate">{t.dashboard.quickDavomatBtn}</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => onNavigate('moliya')}
            className="h-12 sm:h-12 px-5 text-xs sm:text-sm font-extrabold rounded-2xl flex items-center justify-center gap-2.5 w-full sm:w-auto"
          >
            <CreditCard className="w-4 h-4 shrink-0 text-slate-700 stroke-[2.4]" />
            <span className="truncate">{t.dashboard.quickPaymentBtn}</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid (4 Volumetric Frosted GlassClay Pods) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Pod 1: Attendance */}
        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.dashboard.todayAttendance}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200/90 shadow-clay-pill flex items-center justify-center">
              <Users className="w-5 h-5 text-akfa-600 stroke-[2.4]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {presentCount} / {totalWorkers}
            </span>
            <span className="text-xs text-present-600 font-black">
              {t.dashboard.presentRatio}
            </span>
          </div>
          <div className="mt-4 flex items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-present-800 font-extrabold bg-gradient-to-b from-present-50 to-present-100/90 px-3 py-1 rounded-full border border-present-200/90 shadow-clay-pill">
              <CheckCircle2 className="w-3.5 h-3.5 text-present-600 stroke-[2.5]" />
              {presentCount} {t.davomat.present}
            </span>
            <span className="inline-flex items-center gap-1.5 text-absent-800 font-extrabold bg-gradient-to-b from-absent-50 to-absent-100/90 px-3 py-1 rounded-full border border-absent-200/90 shadow-clay-pill">
              <XCircle className="w-3.5 h-3.5 text-absent-600 stroke-[2.5]" />
              {absentCount} {t.davomat.absent}
            </span>
          </div>
        </div>

        {/* Pod 2: Accrued Payroll */}
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
          <p className="text-xs text-slate-500 font-semibold mt-3">
            Davomat va kunlik stavkalar asosida
          </p>
        </div>

        {/* Pod 3: Paid Salaries */}
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
          <p className="text-xs text-slate-500 font-semibold mt-3">
            {payments.length} ta kiritilgan to'lov
          </p>
        </div>

        {/* Pod 4: Outstanding Balance */}
        <div className="glass-clay-card p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/15 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {t.dashboard.outstandingBalance}
            </span>
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200/90 shadow-clay-pill flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600 stroke-[2.4]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-800 truncate tracking-tight">
            {formatCurrency(financeOverview.totalPendingBalance)}
          </div>
          <p className="text-xs text-slate-500 font-semibold mt-3">
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
              className="text-akfa-700 font-extrabold rounded-xl"
            >
              <span>{t.davomat.title}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Button>
          }
        >
          {activeWorkers.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-4 text-center">
              Hozircha faol ishchilar yo'q.
            </p>
          ) : (
            <div className="divide-y divide-white/60">
              {activeWorkers.map((worker) => {
                const record = todaysAttendance.find((a) => a.workerId === worker.id);
                const isPresent = record?.status === 'PRESENT';

                return (
                  <div key={worker.id} className="py-3.5 flex items-center justify-between gap-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="clay-avatar w-10 h-10 rounded-2xl flex items-center justify-center font-black text-slate-800 text-sm flex-shrink-0">
                        {worker.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-extrabold text-slate-900 truncate">
                            {worker.name}
                          </p>
                          <Badge role={worker.role} size="sm" />
                        </div>
                        <p className="text-xs text-slate-500 font-semibold mt-0.5">
                          {formatCurrency(worker.dailyRate)} / {t.davomat.ratePerDay}
                        </p>
                      </div>
                    </div>
                    <div>
                      {isPresent ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-present-800 bg-gradient-to-b from-present-50 to-present-100 px-3.5 py-1.5 rounded-full border border-present-200/90 shadow-clay-pill">
                          <CheckCircle2 className="w-3.5 h-3.5 text-present-600 stroke-[2.5]" />
                          {t.davomat.present}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-absent-800 bg-gradient-to-b from-absent-50 to-absent-100 px-3.5 py-1.5 rounded-full border border-absent-200/90 shadow-clay-pill">
                          <XCircle className="w-3.5 h-3.5 text-absent-600 stroke-[2.5]" />
                          {t.davomat.absent}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
              className="text-akfa-700 font-extrabold rounded-xl"
            >
              <span>{t.moliya.title}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Button>
          }
        >
          {payments.length === 0 ? (
            <p className="text-xs text-slate-500 font-semibold py-4 text-center">
              Hozircha kiritilgan to'lovlar mavjud emas.
            </p>
          ) : (
            <div className="divide-y divide-white/60">
              {payments.slice(0, 4).map((payment) => (
                <div key={payment.id} className="py-3.5 flex items-center justify-between gap-3.5">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900 truncate">
                      {payment.workerName || 'Ishchi'}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold mt-0.5">
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
                    <span className="text-sm font-black text-akfa-700 bg-blue-50/80 px-3 py-1 rounded-full border border-blue-200/70 shadow-clay-pill">
                      {formatCurrency(payment.amount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
