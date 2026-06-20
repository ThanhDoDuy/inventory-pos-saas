import { useMemo } from 'react';
import useSWR from 'swr';
import {
  apiPatch,
  apiPost,
  API_BASE_URL,
  extractErrorMessage,
  swrFetcher as fetcher,
} from '@/lib/api-client';
import { tMessage } from '@/lib/i18n/get-message';

export interface SettingItem {
  key: string;
  value: string;
  type: string;
  group: string;
  description?: string;
}

export interface FeatureFlagItem {
  key: string;
  enabled: boolean;
  description?: string;
}

interface SettingsListResponse {
  settings: SettingItem[];
  feature_flags: FeatureFlagItem[];
}

export const POLICY_SETTING_KEYS = [
  'inventory.allow_negative_stock',
  'inventory.low_stock_threshold',
  'sales.max_discount_staff',
  'sales.max_discount_manager',
] as const;

const EMPTY_SETTINGS: SettingItem[] = [];
const EMPTY_FEATURE_FLAGS: FeatureFlagItem[] = [];

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<SettingsListResponse>(
    `${API_BASE_URL}/settings`,
    fetcher,
    { revalidateOnFocus: false },
  );

  const settings = useMemo(
    () => data?.settings ?? EMPTY_SETTINGS,
    [data?.settings],
  );
  const featureFlags = useMemo(
    () => data?.feature_flags ?? EMPTY_FEATURE_FLAGS,
    [data?.feature_flags],
  );

  return {
    settings,
    featureFlags,
    isLoading,
    error,
    mutate,
  };
}

export function getSettingValue(
  settings: SettingItem[],
  key: string,
  fallback = '',
): string {
  return settings.find((item) => item.key === key)?.value ?? fallback;
}

export function isFeatureEnabled(
  flags: FeatureFlagItem[],
  key: string,
  fallback = false,
): boolean {
  const flag = flags.find((item) => item.key === key);
  return flag ? flag.enabled : fallback;
}

export async function bulkUpdateSettings(
  items: Array<{ key: string; value: string }>,
) {
  try {
    return await apiPost<unknown[]>('/settings/bulk-update', { items });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('settings.error.saveFailed')));
  }
}

export async function toggleFeatureFlag(key: string, enabled: boolean) {
  try {
    return await apiPatch<FeatureFlagItem>(`/settings/feature/${key}`, { enabled });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('settings.error.featureFlagFailed')));
  }
}

export async function changePassword(oldPassword: string, newPassword: string) {
  try {
    return await apiPatch<{ message: string }>('/auth/change-password', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('settings.account.changePasswordError')));
  }
}
