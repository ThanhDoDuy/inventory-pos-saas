'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/auth-store';
import { extractErrorMessage } from '@/lib/api-client';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useTranslation } from '@/lib/i18n/use-translation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [tenantName, setTenantName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const signup = useAuthStore((state) => state.signup);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsLoading(true);

    try {
      await signup({ tenantName, username, email, password });
      router.push('/dashboard');
    } catch (err) {
      setError(extractErrorMessage(err, t('auth.signupFailed')));
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
            <h1 className="text-3xl font-bold text-foreground mb-2">{t('auth.signupTitle')}</h1>
            <p className="text-muted-foreground">{t('auth.signupSubtitle')}</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
              <p className="text-destructive text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="tenantName" className="block text-sm font-medium text-foreground mb-2">
                {t('auth.storeName')}
              </label>
              <input
                id="tenantName"
                type="text"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                placeholder={t('auth.storePlaceholder')}
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                {t('auth.username')}
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                placeholder={t('auth.usernamePlaceholder')}
                required
                disabled={isLoading}
              />
            </div>

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

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                {t('auth.password')}
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                placeholder="••••••••"
                required
                minLength={8}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                {t('auth.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('auth.creating') : t('auth.createAccount')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-muted-foreground text-sm">
              {t('auth.hasAccount')}{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                {t('auth.loginLink')}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
