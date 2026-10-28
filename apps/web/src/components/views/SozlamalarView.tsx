import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { EmptyState } from '../ui/EmptyState';
import { ThemeSwitcher } from '../layout/ThemeSwitcher';
import { WorkerRole, Worker } from '@akfa/shared';
import {
  Users,
  UserPlus,
  Archive,
  RotateCcw,
  Building2,
  Pencil,
  Check,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const SozlamalarView: React.FC = () => {
  const { t, lang, setLang, formatCurrency } = useLanguage();
  const { owner, updateOwnerProfile } = useAuth();
  const {
    activeWorkers,
    archivedWorkers,
    addWorker,
    updateWorker,
    archiveWorker,
    unarchiveWorker,
    deleteWorker,
    clearError,
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<'workers' | 'profile'>('workers');
  const [workerListFilter, setWorkerListFilter] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Add / Edit Worker Modal State
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<WorkerRole>('usta');
  const [dailyRate, setDailyRate] = useState('');
  const [workerFormError, setWorkerFormError] = useState('');
  const [isSubmittingWorker, setIsSubmittingWorker] = useState(false);

  // Owner Profile Form State
  const [workshopName, setWorkshopName] = useState(owner?.workshopName || '');
  const [fullName, setFullName] = useState(owner?.fullName || '');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  const openAddWorkerModal = () => {
    setEditingWorkerId(null);
    setName('');
    setPhone('');
    setRole('usta');
    setDailyRate('200000');
    setWorkerFormError('');
    clearError();
    setIsWorkerModalOpen(true);
  };

  const openEditWorkerModal = (w: Worker) => {
    setEditingWorkerId(w.id);
    setName(w.name);
    setPhone(w.phone || '');
    setRole(w.role);
    setDailyRate(String(w.dailyRate));
    setWorkerFormError('');
    clearError();
    setIsWorkerModalOpen(true);
  };

  const handleWorkerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setWorkerFormError("Ishchi ismini kiriting");
      return;
    }
    const cleanRate = String(dailyRate).replace(/\s/g, '');
    const rateNum = Number(cleanRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setWorkerFormError("Kunlik stavka 0 dan yuqori bo'lishi kerak");
      return;
    }

    setIsSubmittingWorker(true);
    setWorkerFormError('');

    try {
      if (editingWorkerId) {
        await updateWorker(editingWorkerId, {
          name: name.trim(),
          phone: phone.trim() || null,
          role,
          dailyRate: rateNum,
        });
      } else {
        await addWorker({
          name: name.trim(),
          phone: phone.trim() || null,
          role,
          dailyRate: rateNum,
        });
      }
      setIsWorkerModalOpen(false);
    } catch (err: any) {
      setWorkerFormError(err.message || "Xatolik yuz berdi");
    } finally {
      setIsSubmittingWorker(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingProfile(true);
    setProfileErrorMsg('');
    try {
      await updateOwnerProfile({
        fullName,
        workshopName,
        language: lang,
      });
      setProfileSuccessMsg(true);
      setTimeout(() => setProfileSuccessMsg(false), 3000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || "Profilni saqlashda xatolik yuz berdi");
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  const displayedWorkers = workerListFilter === 'ACTIVE' ? activeWorkers : archivedWorkers;

  return (
    <div className="space-y-7 animate-in fade-in duration-200">
      {/* View Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{t.sozlamalar.title}</h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1">{t.sozlamalar.subtitle}</p>
      </div>

      {/* Segmented Sub Tabs (Frosted Capsule) */}
      <div className="inline-flex p-1.5 glass-slot rounded-2xl shadow-glass-slot">
        <button
          onClick={() => setActiveSubTab('workers')}
          className={`flex items-center gap-2.5 px-5 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeSubTab === 'workers'
              ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Users className="w-4 h-4 stroke-[2.4]" />
          <span>{t.sozlamalar.tabWorkers}</span>
          <span className="ml-1 text-[11px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-black shadow-clay-pill">
            {activeWorkers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2.5 px-5 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-800/40'
          }`}
        >
          <Building2 className="w-4 h-4 stroke-[2.4]" />
          <span>{t.sozlamalar.tabProfile}</span>
        </button>
      </div>

      {/* SUB-TAB 1: WORKERS MANAGEMENT */}
      {activeSubTab === 'workers' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Filter Toggle: Active vs Archived */}
            <div className="inline-flex p-1.5 glass-slot rounded-2xl shadow-glass-slot">
              <button
                onClick={() => setWorkerListFilter('ACTIVE')}
                className={`clay-interactive px-4 py-2 text-xs font-black rounded-xl cursor-pointer ${
                  workerListFilter === 'ACTIVE'
                    ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.sozlamalar.activeWorkersTab} ({activeWorkers.length})
              </button>
              <button
                onClick={() => setWorkerListFilter('ARCHIVED')}
                className={`clay-interactive px-4 py-2 text-xs font-black rounded-xl cursor-pointer ${
                  workerListFilter === 'ARCHIVED'
                    ? 'bg-white dark:bg-slate-800 text-akfa-700 dark:text-blue-300 shadow-clay-card border border-white dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.sozlamalar.archivedWorkersTab} ({archivedWorkers.length})
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={openAddWorkerModal} className="h-11 px-5 rounded-2xl shadow-clay-btn-primary">
              <UserPlus className="w-4 h-4 stroke-[2.4]" />
              <span className="font-extrabold">{t.sozlamalar.addWorkerBtn}</span>
            </Button>
          </div>

          {displayedWorkers.length === 0 ? (
            <EmptyState
              icon={Users}
              title={
                workerListFilter === 'ACTIVE'
                  ? t.emptyStates.noWorkers
                  : t.emptyStates.noArchivedWorkers
              }
              action={
                workerListFilter === 'ACTIVE' && (
                  <Button variant="primary" size="sm" onClick={openAddWorkerModal} className="rounded-2xl">
                    <UserPlus className="w-4 h-4 stroke-[2.4]" />
                    <span>{t.sozlamalar.addWorkerBtn}</span>
                  </Button>
                )
              }
            />
          ) : (
            <div className="space-y-4">
              {displayedWorkers.map((worker) => (
                <div
                  key={worker.id}
                  className="glass-clay-card p-5 sm:p-6 flex flex-col gap-4 group"
                >
                  {/* Top: Avatar, Name, Badges, Rate, Phone & Desktop Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                      <div className="clay-avatar w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-slate-800 dark:text-slate-100 text-base sm:text-lg flex-shrink-0">
                        {worker.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                            {worker.name}
                          </h4>
                          <Badge role={worker.role} size="sm" />
                          <Badge status={worker.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-semibold mt-1 flex-wrap">
                          <span className="font-extrabold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                            {formatCurrency(worker.dailyRate)}
                          </span>
                          <span>&bull;</span>
                          <span className="whitespace-nowrap">{t.davomat.ratePerDay}</span>
                          {worker.phone && (
                            <>
                              <span>&bull;</span>
                              <span className="text-slate-700 dark:text-slate-300 font-bold whitespace-nowrap">{worker.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Desktop Actions (Horizontal row) */}
                    <div className="hidden sm:flex items-center gap-2 shrink-0">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditWorkerModal(worker)}
                        className="text-xs font-black rounded-xl"
                      >
                        <Pencil className="w-3.5 h-3.5 stroke-[2.4]" />
                        <span>{t.common.edit}</span>
                      </Button>

                      {worker.status === 'ACTIVE' ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(t.sozlamalar.archiveWorkerConfirm)) {
                              archiveWorker(worker.id);
                            }
                          }}
                          className="text-xs font-black text-amber-800 dark:text-amber-400 hover:bg-amber-100/70 dark:hover:bg-amber-950/50 rounded-xl"
                        >
                          <Archive className="w-3.5 h-3.5 stroke-[2.4]" />
                          <span>{t.sozlamalar.archiveWorker}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(t.sozlamalar.unarchiveWorkerConfirm)) {
                              unarchiveWorker(worker.id);
                            }
                          }}
                          className="text-xs font-black text-emerald-800 dark:text-emerald-400 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/50 rounded-xl"
                        >
                          <RotateCcw className="w-3.5 h-3.5 stroke-[2.4]" />
                          <span>{t.sozlamalar.unarchiveWorker}</span>
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(`"${worker.name}" ishchisini butunlay o'chirishni tasdiqlaysizmi?`)) {
                            deleteWorker(worker.id);
                          }
                        }}
                        className="text-xs font-black text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-950/50 rounded-xl"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />
                        <span>{t.common.delete}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Actions: 3 Balanced, Comfortable Touch Buttons */}
                  <div className="grid grid-cols-3 gap-2 sm:hidden pt-3 border-t border-white/60 dark:border-slate-800">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditWorkerModal(worker)}
                      className="w-full justify-center text-xs font-black py-2.5 rounded-xl h-auto"
                    >
                      <Pencil className="w-3.5 h-3.5 stroke-[2.4]" />
                      <span>{t.common.edit}</span>
                    </Button>

                    {worker.status === 'ACTIVE' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(t.sozlamalar.archiveWorkerConfirm)) {
                            archiveWorker(worker.id);
                          }
                        }}
                        className="w-full justify-center text-xs font-black py-2.5 rounded-xl h-auto text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/50 border border-amber-200/80 dark:border-amber-800/60"
                      >
                        <Archive className="w-3.5 h-3.5 stroke-[2.4]" />
                        <span>{t.sozlamalar.archiveWorker}</span>
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (window.confirm(t.sozlamalar.unarchiveWorkerConfirm)) {
                            unarchiveWorker(worker.id);
                          }
                        }}
                        className="w-full justify-center text-xs font-black py-2.5 rounded-xl h-auto text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800/60"
                      >
                        <RotateCcw className="w-3.5 h-3.5 stroke-[2.4]" />
                        <span>{t.sozlamalar.unarchiveWorker}</span>
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (window.confirm(`"${worker.name}" ishchisini butunlay o'chirishni tasdiqlaysizmi?`)) {
                          deleteWorker(worker.id);
                        }
                      }}
                      className="w-full justify-center text-xs font-black py-2.5 rounded-xl h-auto text-rose-600 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/50 border border-rose-200/80 dark:border-rose-800/60"
                      title={t.common.delete}
                    >
                      <Trash2 className="w-3.5 h-3.5 stroke-[2.4]" />
                      <span>{t.common.delete}</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: OWNER PROFILE & WORKSHOP SETTINGS */}
      {activeSubTab === 'profile' && (
        <div className="max-w-2xl">
          <Card title={t.sozlamalar.ownerProfileTitle} subtitle={t.app.ownerOnlyNotice}>
            <form onSubmit={handleProfileSave} className="space-y-5">
              {profileSuccessMsg && (
                <div className="p-4 rounded-2xl bg-emerald-50/90 backdrop-blur-md border border-emerald-200 text-xs text-emerald-800 font-black flex items-center gap-2.5 shadow-clay-card">
                  <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
                  <span>Profil muvaffaqiyatli saqlandi</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-xs sm:text-sm text-rose-800 font-bold flex items-start gap-2.5 shadow-clay-card">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span className="flex-1">{profileErrorMsg}</span>
                </div>
              )}

              <Input
                label={t.sozlamalar.workshopNameLabel}
                value={workshopName}
                onChange={(e) => setWorkshopName(e.target.value)}
                required
              />

              <Input
                label={t.sozlamalar.workerNameLabel}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />

              {/* Language Selection Setting */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {t.sozlamalar.languagePreference}
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setLang('uz')}
                    className={`clay-interactive p-4 text-left rounded-2xl border text-xs transition-all cursor-pointer ${
                      lang === 'uz'
                        ? 'border-akfa-400 dark:border-blue-500 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/50 text-akfa-950 dark:text-blue-100 font-black shadow-clay-card'
                        : 'border-white/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="block font-black text-sm">O'zbekcha (Lotin)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
                      Asosiy tizim tili
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('ru')}
                    className={`clay-interactive p-4 text-left rounded-2xl border text-xs transition-all cursor-pointer ${
                      lang === 'ru'
                        ? 'border-akfa-400 dark:border-blue-500 bg-gradient-to-b from-blue-50 to-blue-100 dark:from-blue-950/70 dark:to-blue-900/50 text-akfa-950 dark:text-blue-100 font-black shadow-clay-card'
                        : 'border-white/80 dark:border-slate-700 bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="block font-black text-sm">Русский язык</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-1 block">
                      Интерфейс на русском
                    </span>
                  </button>
                </div>
              </div>

              {/* Theme Mode Preference Setting */}
              <div>
                <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {t.sozlamalar.themePreference}
                </label>
                <ThemeSwitcher />
              </div>

              <div className="pt-5 border-t border-white/60 dark:border-slate-800 flex justify-end">
                <Button type="submit" variant="primary" size="md" disabled={isSubmittingProfile} className="h-12 px-6 rounded-2xl">
                  {isSubmittingProfile ? t.common.loading : t.sozlamalar.saveProfileBtn}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Add / Edit Worker Modal */}
      <Modal
        isOpen={isWorkerModalOpen}
        onClose={() => setIsWorkerModalOpen(false)}
        title={editingWorkerId ? t.common.edit : t.sozlamalar.addWorkerBtn}
      >
        <form onSubmit={handleWorkerSubmit} className="space-y-5">
          {workerFormError && (
            <div className="p-4 rounded-2xl bg-rose-50/90 backdrop-blur-md border border-rose-200 text-xs sm:text-sm text-rose-800 font-bold flex items-start gap-2.5 animate-in fade-in shadow-clay-card">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span className="flex-1">{workerFormError}</span>
            </div>
          )}

          <Input
            label={t.sozlamalar.workerNameLabel}
            placeholder="Masalan: Sardor Aliyev"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label={t.sozlamalar.workerPhoneLabel}
            placeholder="+998 90 123 45 67"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div>
            <label className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {t.sozlamalar.workerRoleLabel}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkerRole)}
              className="w-full px-4 py-3 bg-white/60 dark:bg-slate-800/80 backdrop-blur-xl border border-white/85 dark:border-slate-700 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-akfa-500/20 focus:border-akfa-500 focus:bg-white/95 dark:focus:bg-slate-800 transition-all shadow-[inset_0_2px_4px_rgba(15,23,42,0.06),_0_1px_2px_rgba(255,255,255,0.8)]"
            >
              <option value="usta" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t.roles.usta}</option>
              <option value="shogird" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t.roles.shogird}</option>
              <option value="yordamchi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t.roles.yordamchi}</option>
              <option value="ornatuvchi" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t.roles.ornatuvchi}</option>
              <option value="boshqa" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">{t.roles.boshqa}</option>
            </select>
          </div>

          <div>
            <Input
              type="number"
              label={t.sozlamalar.workerRateLabel}
              placeholder="200000"
              value={dailyRate}
              onChange={(e) => setDailyRate(e.target.value)}
              required
            />
            <div className="flex flex-wrap gap-2 mt-3">
              {[120000, 150000, 200000, 250000, 300000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setDailyRate(String(rate))}
                  className="clay-interactive px-3.5 py-1.5 text-xs bg-gradient-to-b from-white to-slate-100 text-slate-800 rounded-full font-black border border-white shadow-clay-pill transition-all cursor-pointer"
                >
                  {formatCurrency(rate)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/60">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsWorkerModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmittingWorker} className="rounded-2xl">
              {isSubmittingWorker ? t.common.loading : t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
