'use client';

import { Building2, Banknote, Bell, Shield, LogOut } from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/use-translation';
import {
  createPriceTier,
  updatePriceTier,
  usePriceTiers,
} from '@/hooks/use-price-tiers';

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('business');
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const { tiers, mutate: mutateTiers } = usePriceTiers();
  const [customCode, setCustomCode] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [tierMessage, setTierMessage] = useState('');
  const [tierError, setTierError] = useState('');
  const [isSavingTier, setIsSavingTier] = useState(false);
  const [editingLabels, setEditingLabels] = useState<Record<string, string>>({});

  const customTiers = tiers.filter((tier) => !tier.is_system);
  const canAddCustom = customTiers.length === 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSaveCustomTier = async () => {
    setTierError('');
    setTierMessage('');
    if (!customCode.trim() || !customLabel.trim()) return;

    setIsSavingTier(true);
    try {
      await createPriceTier({
        code: customCode.trim().toUpperCase(),
        label: customLabel.trim(),
      });
      await mutateTiers();
      setCustomCode('');
      setCustomLabel('');
      setTierMessage(t('settings.priceTiers.saved'));
    } catch (err) {
      setTierError(err instanceof Error ? err.message : t('settings.priceTiers.error'));
    } finally {
      setIsSavingTier(false);
    }
  };

  const handleUpdateTierLabel = async (code: string) => {
    const label = editingLabels[code]?.trim();
    if (!label) return;

    setIsSavingTier(true);
    setTierError('');
    try {
      await updatePriceTier(code, { label });
      await mutateTiers();
      setTierMessage(t('settings.priceTiers.saved'));
    } catch (err) {
      setTierError(err instanceof Error ? err.message : t('settings.priceTiers.error'));
    } finally {
      setIsSavingTier(false);
    }
  };

  const tabs = [
    { id: 'business', label: t('settings.tabs.business'), icon: Building2 },
    { id: 'billing', label: t('settings.tabs.billing'), icon: Banknote },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
  ];

  const notificationItems = [
    {
      label: t('settings.notifications.lowStock.label'),
      description: t('settings.notifications.lowStock.desc'),
    },
    {
      label: t('settings.notifications.salesReports.label'),
      description: t('settings.notifications.salesReports.desc'),
    },
    {
      label: t('settings.notifications.systemUpdates.label'),
      description: t('settings.notifications.systemUpdates.desc'),
    },
    {
      label: t('settings.notifications.securityAlerts.label'),
      description: t('settings.notifications.securityAlerts.desc'),
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('settings.title')}</h1>
        <p className="text-muted-foreground">{t('settings.subtitle')}</p>
      </div>

      <div className="flex gap-2 mb-8 border-b border-border overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-semibold transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'business' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('settings.business.title')}</h2>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('settings.business.name')}</label>
                <input
                  type="text"
                  defaultValue={user?.tenantName}
                  className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('settings.business.address')}</label>
                  <input
                    type="text"
                    placeholder={t('settings.placeholders.address')}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('settings.business.phone')}</label>
                  <input
                    type="tel"
                    placeholder={t('settings.placeholders.phone')}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('settings.business.city')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">{t('settings.business.state')}</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
            <button className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
              {t('settings.buttons.saveChanges')}
            </button>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-2">{t('settings.priceTiers.title')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('settings.priceTiers.subtitle')}</p>

            {tierMessage && (
              <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                {tierMessage}
              </p>
            )}
            {tierError && (
              <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {tierError}
              </p>
            )}

            <div className="space-y-3 mb-6">
              {tiers.map((tier) => (
                <div
                  key={tier.code}
                  className="flex flex-col md:flex-row md:items-center gap-3 p-4 border border-border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{tier.code}</p>
                    <p className="text-xs text-muted-foreground">
                      {tier.is_system ? t('settings.priceTiers.system') : t('settings.priceTiers.custom')}
                    </p>
                  </div>
                  {tier.is_system ? (
                    <p className="text-foreground font-medium">{tier.label}</p>
                  ) : (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="text"
                        defaultValue={tier.label}
                        onChange={(e) =>
                          setEditingLabels((prev) => ({
                            ...prev,
                            [tier.code]: e.target.value,
                          }))
                        }
                        className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-foreground"
                      />
                      <button
                        type="button"
                        disabled={isSavingTier}
                        onClick={() => handleUpdateTierLabel(tier.code)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                      >
                        {t('settings.priceTiers.save')}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {canAddCustom ? (
              <div className="space-y-4 border-t border-border pt-6">
                <h3 className="font-semibold text-foreground">{t('settings.priceTiers.addCustom')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('settings.priceTiers.code')}
                    </label>
                    <input
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder={t('settings.priceTiers.codePlaceholder')}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('settings.priceTiers.label')}
                    </label>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder={t('settings.priceTiers.labelPlaceholder')}
                      className="w-full px-4 py-2 border border-input rounded-lg bg-background text-foreground"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSavingTier || !customCode.trim() || !customLabel.trim()}
                  onClick={handleSaveCustomTier}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50"
                >
                  {t('settings.priceTiers.addCustom')}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground border-t border-border pt-4">
                {t('settings.priceTiers.limitReached')}
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('settings.billing.title')}</h2>
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-muted-foreground text-sm mb-1">{t('settings.billing.currentPlan')}</p>
                <p className="text-2xl font-bold text-foreground">Professional</p>
                <p className="text-muted-foreground text-sm mt-2">{t('settings.billing.planDetail')}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">{t('settings.billing.paymentMethod')}</label>
                <div className="p-4 border border-input rounded-lg">
                  <p className="font-semibold text-foreground">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">{t('settings.billing.cardInfo')}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-2 border border-input rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground">
                {t('settings.buttons.updatePayment')}
              </button>
              <button className="px-6 py-2 border border-input rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground">
                {t('settings.buttons.downloadInvoice')}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('settings.notifications.title')}</h2>
            <div className="space-y-4">
              {notificationItems.map((notification, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div>
                    <p className="font-semibold text-foreground">{notification.label}</p>
                    <p className="text-sm text-muted-foreground">{notification.description}</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded" />
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('settings.security.title')}</h2>
            <div className="space-y-4">
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{t('settings.security.password')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.security.passwordLastChanged')}</p>
                  </div>
                  <button className="px-4 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors">
                    {t('settings.buttons.changePassword')}
                  </button>
                </div>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{t('settings.security.twoFactor')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.security.twoFactorDisabled')}</p>
                  </div>
                  <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    {t('settings.buttons.enable2FA')}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-destructive">{t('settings.security.deleteAccount')}</p>
                    <p className="text-sm text-destructive/80">{t('settings.security.deleteWarning')}</p>
                  </div>
                  <button className="px-4 py-2 border border-destructive text-destructive rounded-lg font-semibold hover:bg-destructive/10 transition-colors">
                    {t('settings.buttons.delete')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8 bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-foreground">{t('settings.signOut.title')}</p>
            <p className="text-sm text-muted-foreground">{t('settings.signOut.description')}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
          >
            <LogOut size={20} />
            {t('settings.buttons.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
