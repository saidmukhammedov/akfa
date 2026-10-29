import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { ThemeSwitcher } from '../layout/ThemeSwitcher';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export const AuthView: React.FC = () => {
  const { t } = useLanguage();
  const { isInitialized, login, setup, authError, clearError } = useAuth();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('Alisher Qodirov');
  const [workshopName, setWorkshopName] = useState('AKFA Rom va Eshiklar Tsexi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    setIsSubmitting(true);

    try {
      if (!isInitialized) {
        if (!fullName.trim() || !username.trim() || !password.trim()) {
          setLocalError("Barcha maydonlarni to'ldiring");
          setIsSubmitting(false);
          return;
        }
        await setup({
          username: username.trim(),
          password,
          fullName: fullName.trim(),
          workshopName: workshopName.trim(),
        });
      } else {
        await login(username.trim(), password);
      }
    } catch (err: any) {
      setLocalError(err.message || 'Xatolik yuz berdi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="relative min-h-screen bg-[#eaf1f9] dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 overflow-hidden transition-colors duration-200">
      {/* Ambient background light orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 transform-gpu">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-blue-300/20 dark:bg-blue-600/15 blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-indigo-300/15 dark:bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-sky-200/20 dark:bg-sky-600/10 blur-3xl pointer-events-none" />
      </div>

      {/* Top Controls: Theme & Language Switcher */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
        <ThemeSwitcher compact />
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-akfa-500 via-akfa-600 to-indigo-700 flex items-center justify-center text-white shadow-clay-btn-primary border border-akfa-400/50 select-none">
            <span className="font-black tracking-widest text-xs drop-shadow-md">AKFA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {!isInitialized ? "Ustaxona Tizimini O'rnatish" : t.auth.loginTitle}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto font-medium">
            {!isInitialized
              ? "Tizimning dastlabki egasi hisobini yarating. Bu amal faqat bir marta bajariladi."
              : t.auth.loginSubtitle}
          </p>
        </div>

        <Card padding="lg" className="shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/50 backdrop-blur-md border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 font-semibold flex items-center gap-2 animate-in fade-in shadow-clay-sm">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 flex-shrink-0" />
                <span>{displayError}</span>
              </div>
            )}

            {!isInitialized && (
              <>
                <Input
                  label="Ustaxona egasining F.I.Sh"
                  placeholder="Masalan: Alisher Qodirov"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />

                <Input
                  label="Ustaxona (Tsex) nomi"
                  placeholder="Masalan: AKFA Rom va Eshiklar Tsexi"
                  value={workshopName}
                  onChange={(e) => setWorkshopName(e.target.value)}
                  required
                />
              </>
            )}

            <Input
              label={t.auth.usernameLabel}
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              type="password"
              label={t.auth.passwordLabel}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isSubmitting}
              className="mt-2 shadow-clay-btn-primary rounded-2xl flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                  <span>{t.common.loading}</span>
                </>
              ) : !isInitialized ? (
                <span>O'rnatish va Boshlash</span>
              ) : (
                <span>{t.auth.loginButton}</span>
              )}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-200/50 dark:border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t.app.ownerOnlyNotice}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
