import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { LanguageSwitcher } from '../layout/LanguageSwitcher';
import { ShieldCheck, AlertCircle } from 'lucide-react';

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
    <div className="min-h-screen bg-workshop-bg flex flex-col justify-center items-center p-4">
      {/* Top Language Switcher */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-akfa-600 to-akfa-800 flex items-center justify-center text-white shadow-clay-btn border border-akfa-500/30">
            <span className="font-extrabold tracking-wider text-sm">AKFA</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-workshop-text">
            {!isInitialized ? "Ustaxona Tizimini O'rnatish" : t.auth.loginTitle}
          </h1>
          <p className="text-xs text-workshop-muted mt-1 max-w-sm mx-auto">
            {!isInitialized
              ? "Tizimning dastlabki egasi hisobini yarating. Bu amal faqat bir marta bajariladi."
              : t.auth.loginSubtitle}
          </p>
        </div>

        <Card padding="lg" className="shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div className="p-3 rounded-xl bg-absent-50 border border-absent-200 text-xs text-absent-800 font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-absent-600 flex-shrink-0" />
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
              className="mt-2"
            >
              {isSubmitting ? (
                <span>{t.common.loading}</span>
              ) : !isInitialized ? (
                <span>O'rnatish va Boshlash</span>
              ) : (
                <span>{t.auth.loginButton}</span>
              )}
            </Button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.app.ownerOnlyNotice}</span>
          </div>
        </Card>
      </div>
    </div>
  );
};
