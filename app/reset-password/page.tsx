'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { extractErrorMessage } from '@/lib/api-client';
import { confirmPasswordReset } from '@/lib/auth-api';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/use-translation';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useTranslation();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError(t('auth.invalidResetToken'));
      return;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await confirmPasswordReset(token, password);
      setSuccess(true);
      setTimeout(() => router.push('/login'), 3000);
    } catch (err) {
      setError(extractErrorMessage(err, t('auth.passwordResetFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{t('auth.invalidResetToken')}</p>
        </div>
        <Link
          href="/forgot-password"
          className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
        >
          {t('auth.sendResetLink')}
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
          <p className="text-foreground text-sm">{t('auth.resetPasswordSuccess')}</p>
        </div>
        <Link
          href="/login"
          className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
        >
          {t('auth.backToLogin')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
          {t('auth.newPassword')}
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
          placeholder="••••••••"
          minLength={8}
          required
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="confirm-password"
          className="block text-sm font-medium text-foreground mb-2"
        >
          {t('auth.confirmNewPassword')}
        </label>
        <input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
          placeholder="••••••••"
          minLength={8}
          required
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? t('auth.resettingPassword') : t('auth.resetPasswordSubmit')}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('auth.resetPasswordTitle')}
            </h1>
            <p className="text-muted-foreground">{t('auth.resetPasswordSubtitle')}</p>
          </div>

          <Suspense fallback={<p className="text-muted-foreground text-sm">{t('common.loading')}</p>}>
            <ResetPasswordForm />
          </Suspense>

          <div className="mt-6 text-center">
            <Link href="/login" className="text-primary hover:underline text-sm font-medium">
              {t('auth.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
