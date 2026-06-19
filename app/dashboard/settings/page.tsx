'use client';

import { Building2, Banknote, Bell, Loader2, LogOut, Shield, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n/use-translation';
import {
  createPriceTier,
  updatePriceTier,
  usePriceTiers,
} from '@/hooks/use-price-tiers';
import { updateTenantProfile, useTenant } from '@/hooks/use-tenant';
import {
  bulkUpdateSettings,
  changePassword,
  getSettingValue,
  isFeatureEnabled,
  toggleFeatureFlag,
  useSettings,
  type FeatureFlagItem,
} from '@/hooks/use-settings';
import { FormField, inputClassName } from '@/components/form-field';

const FEATURE_FLAG_KEYS = [
  'enable_low_stock_alert',
  'enable_refund',
  'enable_partial_payment',
] as const;

type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

function isFeatureFlagKey(key: string): key is FeatureFlagKey {
  return (FEATURE_FLAG_KEYS as readonly string[]).includes(key);
}

export default function SettingsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('business');
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();

  const { tenant, isLoading: tenantLoading, mutate: mutateTenant } = useTenant();
  const { settings, featureFlags, isLoading: settingsLoading, mutate: mutateSettings } =
    useSettings();
  const { tiers, mutate: mutateTiers } = usePriceTiers();

  const [businessForm, setBusinessForm] = useState({
    name: '',
    address: '',
    phone: '',
    city: '',
    state: '',
  });
  const [policyForm, setPolicyForm] = useState({
    allowNegativeStock: false,
    lowStockThreshold: '20',
    maxDiscountStaff: '10',
    maxDiscountManager: '30',
  });

  const [businessMessage, setBusinessMessage] = useState('');
  const [businessError, setBusinessError] = useState('');
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);

  const [policyMessage, setPolicyMessage] = useState('');
  const [policyError, setPolicyError] = useState('');
  const [isSavingPolicies, setIsSavingPolicies] = useState(false);

  const [notifMessage, setNotifMessage] = useState('');
  const [notifError, setNotifError] = useState('');
  const [togglingFlag, setTogglingFlag] = useState<string | null>(null);

  const [customCode, setCustomCode] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [tierMessage, setTierMessage] = useState('');
  const [tierError, setTierError] = useState('');
  const [isSavingTier, setIsSavingTier] = useState(false);
  const [editingLabels, setEditingLabels] = useState<Record<string, string>>({});

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (!tenant) return;
    setBusinessForm({
      name: tenant.name,
      address: tenant.address,
      phone: tenant.phone,
      city: tenant.city,
      state: tenant.state,
    });
  }, [tenant]);

  useEffect(() => {
    if (settings.length === 0) return;
    setPolicyForm({
      allowNegativeStock:
        getSettingValue(settings, 'inventory.allow_negative_stock', 'false') === 'true',
      lowStockThreshold: getSettingValue(settings, 'inventory.low_stock_threshold', '20'),
      maxDiscountStaff: getSettingValue(settings, 'sales.max_discount_staff', '10'),
      maxDiscountManager: getSettingValue(settings, 'sales.max_discount_manager', '30'),
    });
  }, [settings]);

  const customTiers = tiers.filter((tier) => !tier.is_system);
  const canAddCustom = customTiers.length === 0;

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleSaveBusiness = async () => {
    setBusinessError('');
    setBusinessMessage('');
    setIsSavingBusiness(true);
    try {
      const updated = await updateTenantProfile(businessForm);
      await mutateTenant();
      if (user) {
        setUser({ ...user, tenantName: updated.name });
      }
      setBusinessMessage(t('settings.business.saved'));
    } catch (err) {
      setBusinessError(err instanceof Error ? err.message : t('settings.business.error'));
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleSavePolicies = async () => {
    setPolicyError('');
    setPolicyMessage('');
    setIsSavingPolicies(true);
    try {
      await bulkUpdateSettings([
        {
          key: 'inventory.allow_negative_stock',
          value: policyForm.allowNegativeStock ? 'true' : 'false',
        },
        {
          key: 'inventory.low_stock_threshold',
          value: policyForm.lowStockThreshold,
        },
        {
          key: 'sales.max_discount_staff',
          value: policyForm.maxDiscountStaff,
        },
        {
          key: 'sales.max_discount_manager',
          value: policyForm.maxDiscountManager,
        },
      ]);
      await mutateSettings();
      setPolicyMessage(t('settings.policies.saved'));
    } catch (err) {
      setPolicyError(err instanceof Error ? err.message : t('settings.policies.error'));
    } finally {
      setIsSavingPolicies(false);
    }
  };

  const handleToggleFeature = async (flag: FeatureFlagItem, enabled: boolean) => {
    setNotifError('');
    setNotifMessage('');
    setTogglingFlag(flag.key);
    try {
      await toggleFeatureFlag(flag.key, enabled);
      await mutateSettings();
      setNotifMessage(t('settings.notifications.saved'));
    } catch (err) {
      setNotifError(err instanceof Error ? err.message : t('settings.notifications.error'));
    } finally {
      setTogglingFlag(null);
    }
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

  const handleChangePassword = async () => {
    setPasswordError('');
    if (passwordForm.newPassword.length < 8) {
      setPasswordError(t('settings.security.passwordMinLength'));
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError(t('settings.security.passwordMismatch'));
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      setShowPasswordModal(false);
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      alert(t('settings.security.passwordChanged'));
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : t('settings.security.changePasswordError'),
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const getFeatureCopy = (key: FeatureFlagKey) => ({
    label: t(`settings.features.${key}.label`),
    desc: t(`settings.features.${key}.desc`),
  });

  const tabs = [
    { id: 'business', label: t('settings.tabs.business'), icon: Building2 },
    { id: 'billing', label: t('settings.tabs.billing'), icon: Banknote },
    { id: 'notifications', label: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', label: t('settings.tabs.security'), icon: Shield },
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
              type="button"
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
            {tenantLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                {t('common.loading')}
              </div>
            ) : (
              <>
                {businessMessage && (
                  <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    {businessMessage}
                  </p>
                )}
                {businessError && (
                  <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    {businessError}
                  </p>
                )}
                <div className="space-y-4 mb-6">
                  <FormField label={t('settings.business.name')} htmlFor="biz-name">
                    <input
                      id="biz-name"
                      type="text"
                      value={businessForm.name}
                      onChange={(e) =>
                        setBusinessForm((f) => ({ ...f, name: e.target.value }))
                      }
                      className={inputClassName}
                    />
                  </FormField>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label={t('settings.business.address')} htmlFor="biz-address">
                      <input
                        id="biz-address"
                        type="text"
                        placeholder={t('settings.placeholders.address')}
                        value={businessForm.address}
                        onChange={(e) =>
                          setBusinessForm((f) => ({ ...f, address: e.target.value }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                    <FormField label={t('settings.business.phone')} htmlFor="biz-phone">
                      <input
                        id="biz-phone"
                        type="tel"
                        placeholder={t('settings.placeholders.phone')}
                        value={businessForm.phone}
                        onChange={(e) =>
                          setBusinessForm((f) => ({ ...f, phone: e.target.value }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField label={t('settings.business.city')} htmlFor="biz-city">
                      <input
                        id="biz-city"
                        type="text"
                        value={businessForm.city}
                        onChange={(e) =>
                          setBusinessForm((f) => ({ ...f, city: e.target.value }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                    <FormField label={t('settings.business.state')} htmlFor="biz-state">
                      <input
                        id="biz-state"
                        type="text"
                        value={businessForm.state}
                        onChange={(e) =>
                          setBusinessForm((f) => ({ ...f, state: e.target.value }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSaveBusiness}
                  disabled={isSavingBusiness}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSavingBusiness ? t('settings.business.saving') : t('settings.buttons.saveChanges')}
                </button>
              </>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('settings.policies.title')}</h2>
            {settingsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                {t('common.loading')}
              </div>
            ) : (
              <>
                {policyMessage && (
                  <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                    {policyMessage}
                  </p>
                )}
                {policyError && (
                  <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                    {policyError}
                  </p>
                )}
                <div className="space-y-4 mb-6">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={policyForm.allowNegativeStock}
                      onChange={(e) =>
                        setPolicyForm((f) => ({
                          ...f,
                          allowNegativeStock: e.target.checked,
                        }))
                      }
                      className="rounded"
                    />
                    <span className="text-sm font-medium">{t('settings.policies.allowNegativeStock')}</span>
                  </label>
                  <FormField
                    label={t('settings.policies.lowStockThreshold')}
                    htmlFor="policy-threshold"
                  >
                    <input
                      id="policy-threshold"
                      type="number"
                      min={0}
                      value={policyForm.lowStockThreshold}
                      onChange={(e) =>
                        setPolicyForm((f) => ({ ...f, lowStockThreshold: e.target.value }))
                      }
                      className={`${inputClassName} max-w-xs`}
                    />
                  </FormField>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label={t('settings.policies.maxDiscountStaff')}
                      htmlFor="policy-staff-discount"
                    >
                      <input
                        id="policy-staff-discount"
                        type="number"
                        min={0}
                        max={100}
                        value={policyForm.maxDiscountStaff}
                        onChange={(e) =>
                          setPolicyForm((f) => ({ ...f, maxDiscountStaff: e.target.value }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                    <FormField
                      label={t('settings.policies.maxDiscountManager')}
                      htmlFor="policy-manager-discount"
                    >
                      <input
                        id="policy-manager-discount"
                        type="number"
                        min={0}
                        max={100}
                        value={policyForm.maxDiscountManager}
                        onChange={(e) =>
                          setPolicyForm((f) => ({ ...f, maxDiscountManager: e.target.value }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSavePolicies}
                  disabled={isSavingPolicies}
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isSavingPolicies ? t('settings.policies.saving') : t('settings.buttons.saveChanges')}
                </button>
              </>
            )}
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
                        className={`${inputClassName} flex-1`}
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
                  <FormField label={t('settings.priceTiers.code')} htmlFor="tier-code">
                    <input
                      id="tier-code"
                      type="text"
                      value={customCode}
                      onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                      placeholder={t('settings.priceTiers.codePlaceholder')}
                      className={inputClassName}
                    />
                  </FormField>
                  <FormField label={t('settings.priceTiers.label')} htmlFor="tier-label">
                    <input
                      id="tier-label"
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder={t('settings.priceTiers.labelPlaceholder')}
                      className={inputClassName}
                    />
                  </FormField>
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
            <h2 className="text-xl font-bold text-foreground mb-2">{t('settings.billing.title')}</h2>
            <p className="text-sm text-muted-foreground mb-6">{t('settings.billing.notAvailable')}</p>
            <div className="space-y-4 mb-6 opacity-60">
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-muted-foreground text-sm mb-1">{t('settings.billing.currentPlan')}</p>
                <p className="text-2xl font-bold text-foreground">Professional</p>
                <p className="text-muted-foreground text-sm mt-2">{t('settings.billing.planDetail')}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-2">{t('settings.billing.paymentMethod')}</p>
                <div className="p-4 border border-input rounded-lg">
                  <p className="font-semibold text-foreground">Visa ending in 4242</p>
                  <p className="text-sm text-muted-foreground">{t('settings.billing.cardInfo')}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                disabled
                className="px-6 py-2 border border-input rounded-lg font-semibold text-muted-foreground cursor-not-allowed"
              >
                {t('settings.buttons.updatePayment')}
              </button>
              <button
                type="button"
                disabled
                className="px-6 py-2 border border-input rounded-lg font-semibold text-muted-foreground cursor-not-allowed"
              >
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
            {notifMessage && (
              <p className="mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3">
                {notifMessage}
              </p>
            )}
            {notifError && (
              <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {notifError}
              </p>
            )}
            {settingsLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={18} />
                {t('common.loading')}
              </div>
            ) : (
              <div className="space-y-4">
                {featureFlags
                  .filter((flag): flag is FeatureFlagItem & { key: FeatureFlagKey } =>
                    isFeatureFlagKey(flag.key),
                  )
                  .map((flag) => {
                    const copy = getFeatureCopy(flag.key);
                    const enabled = isFeatureEnabled(featureFlags, flag.key);
                    return (
                      <div
                        key={flag.key}
                        className="flex items-center justify-between p-4 border border-border rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{copy.label}</p>
                          <p className="text-sm text-muted-foreground">{copy.desc}</p>
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer">
                          {togglingFlag === flag.key && (
                            <Loader2 className="animate-spin text-muted-foreground" size={16} />
                          )}
                          <input
                            type="checkbox"
                            checked={enabled}
                            disabled={togglingFlag === flag.key}
                            onChange={(e) => handleToggleFeature(flag, e.target.checked)}
                            className="rounded"
                          />
                        </label>
                      </div>
                    );
                  })}
              </div>
            )}
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
                    <p className="text-sm text-muted-foreground">
                      {t('settings.security.passwordLastChanged')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordError('');
                      setShowPasswordModal(true);
                    }}
                    className="px-4 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                  >
                    {t('settings.buttons.changePassword')}
                  </button>
                </div>
              </div>
              <div className="p-4 border border-border rounded-lg opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{t('settings.security.twoFactor')}</p>
                    <p className="text-sm text-muted-foreground">{t('settings.security.twoFactorDisabled')}</p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-lg font-semibold cursor-not-allowed"
                  >
                    {t('settings.security.comingSoon')}
                  </button>
                </div>
              </div>
              <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg opacity-60">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-destructive">{t('settings.security.deleteAccount')}</p>
                    <p className="text-sm text-destructive/80">{t('settings.security.deleteWarning')}</p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="px-4 py-2 border border-destructive/50 text-destructive/70 rounded-lg font-semibold cursor-not-allowed"
                  >
                    {t('settings.security.comingSoon')}
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
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2 bg-destructive text-destructive-foreground rounded-lg font-semibold hover:bg-destructive/90 transition-colors"
          >
            <LogOut size={20} />
            {t('settings.buttons.logout')}
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full">
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-xl font-bold">{t('settings.security.changePasswordTitle')}</h2>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-2 hover:bg-secondary rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            {passwordError && (
              <p className="mb-4 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                {passwordError}
              </p>
            )}
            <div className="space-y-4 mb-6">
              <FormField label={t('settings.security.oldPassword')} htmlFor="old-pw">
                <input
                  id="old-pw"
                  type="password"
                  value={passwordForm.oldPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, oldPassword: e.target.value }))
                  }
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('settings.security.newPassword')} htmlFor="new-pw">
                <input
                  id="new-pw"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))
                  }
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('settings.security.confirmPassword')} htmlFor="confirm-pw">
                <input
                  id="confirm-pw"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                  }
                  className={inputClassName}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 py-2 border border-border rounded-lg font-semibold hover:bg-secondary"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleChangePassword}
                disabled={isChangingPassword}
                className="flex-1 py-2 bg-primary text-primary-foreground rounded-lg font-semibold disabled:opacity-50"
              >
                {isChangingPassword ? t('common.loading') : t('settings.buttons.changePassword')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
