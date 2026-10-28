import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAppState } from '../../context/AppStateContext';
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
  Shield,
  Database,
  Pencil,
  Check,
} from 'lucide-react';

export const SozlamalarView: React.FC = () => {
  const { t, lang, setLang, formatCurrency } = useLanguage();
  const {
    owner,
    activeWorkers,
    archivedWorkers,
    addWorker,
    updateWorker,
    archiveWorker,
    unarchiveWorker,
    updateOwnerProfile,
  } = useAppState();

  const [activeSubTab, setActiveSubTab] = useState<'workers' | 'profile' | 'system'>('workers');
  const [workerListFilter, setWorkerListFilter] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Add / Edit Worker Modal State
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<WorkerRole>('usta');
  const [dailyRate, setDailyRate] = useState('');
  const [workerFormError, setWorkerFormError] = useState('');

  // Owner Profile Form State
  const [workshopName, setWorkshopName] = useState(owner.workshopName);
  const [fullName, setFullName] = useState(owner.fullName);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(false);

  const openAddWorkerModal = () => {
    setEditingWorkerId(null);
    setName('');
    setPhone('');
    setRole('usta');
    setDailyRate('200000');
    setWorkerFormError('');
    setIsWorkerModalOpen(true);
  };

  const openEditWorkerModal = (w: Worker) => {
    setEditingWorkerId(w.id);
    setName(w.name);
    setPhone(w.phone || '');
    setRole(w.role);
    setDailyRate(String(w.dailyRate));
    setWorkerFormError('');
    setIsWorkerModalOpen(true);
  };

  const handleWorkerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setWorkerFormError("Ishchi ismini kiriting");
      return;
    }
    const rateNum = Number(dailyRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      setWorkerFormError("Kunlik stavka 0 dan yuqori bo'lishi kerak");
      return;
    }

    if (editingWorkerId) {
      updateWorker(editingWorkerId, {
        name: name.trim(),
        phone: phone.trim() || null,
        role,
        dailyRate: rateNum,
      });
    } else {
      addWorker({
        name: name.trim(),
        phone: phone.trim() || null,
        role,
        dailyRate: rateNum,
      });
    }

    setIsWorkerModalOpen(false);
  };

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateOwnerProfile(fullName, workshopName);
    setProfileSuccessMsg(true);
    setTimeout(() => setProfileSuccessMsg(false), 3000);
  };

  const displayedWorkers = workerListFilter === 'ACTIVE' ? activeWorkers : archivedWorkers;

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* View Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-workshop-text">{t.sozlamalar.title}</h2>
        <p className="text-xs sm:text-sm text-workshop-muted mt-0.5">{t.sozlamalar.subtitle}</p>
      </div>

      {/* Segmented Sub Tabs */}
      <div className="flex border-b border-workshop-border">
        <button
          onClick={() => setActiveSubTab('workers')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'workers'
              ? 'border-akfa-600 text-akfa-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t.sozlamalar.tabWorkers}</span>
          <span className="ml-1 text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
            {activeWorkers.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('profile')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'profile'
              ? 'border-akfa-600 text-akfa-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t.sozlamalar.tabProfile}</span>
        </button>

        <button
          onClick={() => setActiveSubTab('system')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
            activeSubTab === 'system'
              ? 'border-akfa-600 text-akfa-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>{t.sozlamalar.tabSystem}</span>
        </button>
      </div>

      {/* SUB-TAB 1: WORKERS MANAGEMENT (ACCESSIBLE ONLY THROUGH SOZLAMALAR) */}
      {activeSubTab === 'workers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Filter Toggle: Active vs Archived */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                onClick={() => setWorkerListFilter('ACTIVE')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  workerListFilter === 'ACTIVE'
                    ? 'bg-white text-akfa-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.sozlamalar.activeWorkersTab} ({activeWorkers.length})
              </button>
              <button
                onClick={() => setWorkerListFilter('ARCHIVED')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  workerListFilter === 'ARCHIVED'
                    ? 'bg-white text-akfa-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.sozlamalar.archivedWorkersTab} ({archivedWorkers.length})
              </button>
            </div>

            <Button variant="primary" size="sm" onClick={openAddWorkerModal}>
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
                  <Button variant="primary" size="sm" onClick={openAddWorkerModal}>
                    <UserPlus className="w-4 h-4" />
                    <span>{t.sozlamalar.addWorkerBtn}</span>
                  </Button>
                )
              }
            />
          ) : (
            <Card padding="none">
              <div className="divide-y divide-slate-100">
                {displayedWorkers.map((worker) => (
                  <div
                    key={worker.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm shadow-clay-sm flex-shrink-0">
                        {worker.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-workshop-text">{worker.name}</h4>
                          <Badge role={worker.role} size="sm" />
                          <Badge status={worker.status} size="sm" />
                        </div>
                        <div className="flex items-center gap-2 text-xs text-workshop-muted mt-0.5">
                          <span className="font-semibold text-slate-700">
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
                        className="text-xs"
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
                          className="text-xs text-amber-700 hover:bg-amber-50"
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
                          className="text-xs text-emerald-700 hover:bg-emerald-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t.sozlamalar.unarchiveWorker}</span>
                        </Button>
                      )}
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
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Profil muvaffaqiyatli saqlandi</span>
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
                <label className="block text-xs font-semibold text-workshop-text mb-1.5">
                  {t.sozlamalar.languagePreference}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLang('uz')}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      lang === 'uz'
                        ? 'border-akfa-600 bg-akfa-50/70 text-akfa-900 font-bold shadow-clay-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">O'zbekcha (Lotin)</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Asosiy tizim tili
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setLang('ru')}
                    className={`p-3 text-left rounded-xl border text-xs transition-all ${
                      lang === 'ru'
                        ? 'border-akfa-600 bg-akfa-50/70 text-akfa-900 font-bold shadow-clay-sm'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block font-bold">Русский язык</span>
                    <span className="text-[11px] text-slate-500 font-normal">
                      Интерфейс на русском
                    </span>
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button type="submit" variant="primary" size="md">
                  {t.sozlamalar.saveProfileBtn}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* SUB-TAB 3: SYSTEM INFO & NEON POSTGRESQL ARCHITECTURE */}
      {activeSubTab === 'system' && (
        <div className="max-w-2xl space-y-4">
          <Card title={t.sozlamalar.systemInfo} subtitle="Arxitektura va o'rnatilgan texnologiyalar">
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Baza arxitekturasi:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-akfa-600" />
                  Neon PostgreSQL + Prisma ORM
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Foydalanuvchi huquqlari:</span>
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-emerald-600" />
                  Faqat Ustaxona Egasi (Owner-only)
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Tizim holati:</span>
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Phase 1 Tasdiqlangan
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-600 font-medium">Paketlar tuzilmasi:</span>
                <span className="font-mono text-[11px] text-slate-700">
                  apps/web, apps/api, packages/shared
                </span>
              </div>
            </div>
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
            <div className="p-3 rounded-xl bg-absent-50 border border-absent-200 text-xs text-absent-700 font-medium">
              {workerFormError}
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
            <label className="block text-xs font-semibold text-workshop-text mb-1.5">
              {t.sozlamalar.workerRoleLabel}
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkerRole)}
              className="w-full px-3.5 py-2.5 bg-white border border-workshop-border rounded-xl text-sm text-workshop-text focus:outline-none focus:ring-2 focus:ring-akfa-500/20 focus:border-akfa-600"
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
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[120000, 150000, 200000, 250000, 300000].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setDailyRate(String(rate))}
                  className="px-2 py-0.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md font-medium transition-all"
                >
                  {formatCurrency(rate)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setIsWorkerModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button type="submit" variant="primary" size="md">
              {t.common.save}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
