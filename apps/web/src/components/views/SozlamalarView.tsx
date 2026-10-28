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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* View Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-workshop-text tracking-tight">{t.sozlamalar.title}</h2>
        <p className="text-xs sm:text-sm text-workshop-muted mt-0.5">{t.sozlamalar.subtitle}</p>
      </div>

      {/* Segmented Sub Tabs (Frosted Capsule) */}
      <div className="inline-flex p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-white/70 shadow-inner">
        <button
          onClick={() => setActiveSubTab('workers')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            activeSubTab === 'workers'
              ? 'bg-white/95 text-akfa-700 shadow-clay-card border border-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.sozlamalar.tabWorkers}</span>
          <span className="ml-1 text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold shadow-clay-sm">
            {activeWorkers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all duration-150 active:scale-95 cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-white/95 text-akfa-700 shadow-clay-card border border-white'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/40'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.sozlamalar.tabProfile}</span>
        </button>
      </div>

      {/* SUB-TAB 1: WORKERS MANAGEMENT (ACCESSIBLE ONLY THROUGH SOZLAMALAR) */}
      {activeSubTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Filter Toggle: Active vs Archived */}
            <div className="inline-flex p-1 bg-slate-200/50 backdrop-blur-md rounded-2xl border border-white/70 shadow-inner">
              <button
                onClick={() => setWorkerListFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  workerListFilter === 'ACTIVE'
                    ? 'bg-white/95 text-akfa-700 shadow-clay-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.sozlamalar.activeWorkersTab} ({activeWorkers.length})
              </button>
              <button
                onClick={() => setWorkerListFilter('ARCHIVED')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all active:scale-95 cursor-pointer ${
                  workerListFilter === 'ARCHIVED'
                    ? 'bg-white/95 text-akfa-700 shadow-clay-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.sozlamalar.archivedWorkersTab} ({archivedWorkers.length})
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={openAddWorkerModal} className="shadow-clay-btn-primary rounded-2xl">
              <UserPlus className="w-4 h-4" />
              <span>{t.sozlamalar.addWorkerBtn}</span>
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
                    <UserPlus className="w-4 h-4" />
                    <span>{t.sozlamalar.addWorkerBtn}</span>
                  </Button>
                )
              }
            />
          ) : (
            <Card padding="none">
              <div className="divide-y divide-slate-200/40">
                {displayedWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 hover:bg-white/50 transition-colors"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-white to-slate-100 border border-white/90 shadow-clay-sm flex items-center justify-center font-extrabold text-slate-800 text-sm flex-shrink-0">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-workshop-text">{worker.name}</h4>
                          <Badge role={worker.role} size="sm" />
                          <Badge status={worker.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-workshop-muted font-medium mt-0.5">
                          <span className="font-bold text-slate-700">
                            {formatCurrency(worker.dailyRate)}
                          </span>
                          <span>&bull;</span>
                          <span>{t.davomat.ratePerDay}</span>
                          {worker.phone && (
                            <>
                              <span>&bull;</span>
                              <span>{worker.phone}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openEditWorkerModal(worker)}
                        className="text-xs font-bold rounded-xl"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
                          className="text-xs font-bold text-amber-700 hover:bg-amber-50/80 rounded-xl"
                        >
                          <Archive className="w-3.5 h-3.5" />
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
                          className="text-xs font-bold text-emerald-700 hover:bg-emerald-50/80 rounded-xl"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
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
                        className="text-xs font-bold text-rose-600 hover:bg-rose-50/80 hover:text-rose-700 rounded-xl"
                        title={t.common.delete}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{t.common.delete}</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* SUB-TAB 2: OWNER PROFILE & WORKSHOP SETTINGS */}
      {activeSubTab === 'profile' && (
        <div className="max-w-2xl">
          <Card title={t.sozlamalar.ownerProfileTitle} subtitle={t.app.ownerOnlyNotice}>
            <form onSubmit={handleProfileSave} className="space-y-4">
              {profileSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-50/90 backdrop-blur-md border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2 shadow-clay-sm">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Profil muvaffaqiyatli saqlandi</span>
                </div>
              )}

              {profileErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-absent-50/90 backdrop-blur-md border border-absent-200 text-xs sm:text-sm text-absent-800 font-semibold flex items-start gap-2 shadow-clay-sm">
                  <AlertCircle className="w-4 h-4 text-absent-600 flex-shrink-0 mt-0.5" />
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t.sozlamalar.languagePreference}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLang('uz')}
                    className={`p-3.5 text-left rounded-2xl border text-xs transition-all active:scale-[0.98] cursor-pointer ${
                      lang === 'uz'
                        ? 'border-akfa-400/80 bg-akfa-50/80 backdrop-blur-md text-akfa-900 font-bold shadow-clay-card'
                        : 'border-white/90 bg-white/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="block font-bold">O'zbekcha (Lotin)</span>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                      Asosiy tizim tili
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('ru')}
                    className={`p-3.5 text-left rounded-2xl border text-xs transition-all active:scale-[0.98] cursor-pointer ${
                      lang === 'ru'
                        ? 'border-akfa-400/80 bg-akfa-50/80 backdrop-blur-md text-akfa-900 font-bold shadow-clay-card'
                        : 'border-white/90 bg-white/70 text-slate-700 hover:bg-white'
                    }`}
                  >
                    <span className="block font-bold">Русский язык</span>
                    <span className="text-[11px] text-slate-500 font-medium mt-0.5 block">
                      Интерфейс на русском
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200/50 flex justify-end">
                <Button type="submit" variant="primary" size="md" disabled={isSubmittingProfile} className="rounded-2xl">
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
        <form onSubmit={handleWorkerSubmit} className="space-y-4">
          {workerFormError && (
            <div className="p-3.5 rounded-2xl bg-absent-50/90 backdrop-blur-md border border-absent-200 text-xs sm:text-sm text-absent-800 font-semibold flex items-start gap-2 animate-in fade-in shadow-clay-sm">
              <AlertCircle className="w-4 h-4 text-absent-600 flex-shrink-0 mt-0.5" />
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              {t.sozlamalar.workerRoleLabel}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkerRole)}
              className="w-full px-4 py-2.5 bg-white/70 backdrop-blur-md border border-white/80 rounded-2xl text-sm font-medium text-workshop-text focus:outline-none focus:ring-4 focus:ring-akfa-500/15 focus:border-akfa-500 focus:bg-white/95 transition-all shadow-inner"
            >
              <option value="usta">{t.roles.usta}</option>
              <option value="shogird">{t.roles.shogird}</option>
              <option value="yordamchi">{t.roles.yordamchi}</option>
              <option value="ornatuvchi">{t.roles.ornatuvchi}</option>
              <option value="boshqa">{t.roles.boshqa}</option>
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
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {[120000, 150000, 200000, 250000, 300000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setDailyRate(String(rate))}
                  className="px-3 py-1.5 text-xs bg-slate-200/50 backdrop-blur-md hover:bg-white text-slate-700 rounded-full font-bold border border-white/70 shadow-clay-sm transition-all active:scale-95 cursor-pointer"
                >
                  {formatCurrency(rate)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200/50">
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
