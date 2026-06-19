'use client';

import { useState } from 'react';
import Link from 'next/link';
import { extractErrorMessage } from '@/lib/api-client';
import { requestPasswordReset } from '@/lib/auth-api';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err) {
      setError(extractErrorMessage(err, t('auth.passwordResetFailed')));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg border border-border shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {t('auth.forgotPasswordTitle')}
            </h1>
            <p className="text-muted-foreground">{t('auth.forgotPasswordSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="space-y-6">
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-foreground text-sm">{t('auth.resetLinkSent')}</p>
              </div>
              <Link
                href="/login"
                className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors text-center"
              >
                {t('auth.backToLogin')}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                  {t('auth.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                  placeholder={t('auth.emailPlaceholder')}
                  required
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('auth.sendingResetLink') : t('auth.sendResetLink')}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-primary hover:underline text-sm font-medium">
                {t('auth.backToLogin')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
