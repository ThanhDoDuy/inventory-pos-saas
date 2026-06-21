import type { SettingItem } from '@/hooks/use-settings';
import { getSettingValue } from '@/hooks/use-settings';
import type { TenantProfile } from '@/hooks/use-tenant';

export const RECEIPT_LAYOUT_KEYS = {
  showStoreName: 'receipt.show_store_name',
  showStorePhone: 'receipt.show_store_phone',
  showStoreAddress: 'receipt.show_store_address',
} as const;

export interface ReceiptLayoutConfig {
  showStoreName: boolean;
  showStorePhone: boolean;
  showStoreAddress: boolean;
}

export interface ReceiptStoreInfo {
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
}

export function parseReceiptLayoutConfig(settings: SettingItem[]): ReceiptLayoutConfig {
  return {
    showStoreName:
      getSettingValue(settings, RECEIPT_LAYOUT_KEYS.showStoreName, 'true') === 'true',
    showStorePhone:
      getSettingValue(settings, RECEIPT_LAYOUT_KEYS.showStorePhone, 'false') === 'true',
    showStoreAddress:
      getSettingValue(settings, RECEIPT_LAYOUT_KEYS.showStoreAddress, 'false') === 'true',
  };
}

export function buildTenantAddress(tenant?: Pick<TenantProfile, 'address' | 'city' | 'state'> | null) {
  return [tenant?.address, tenant?.city, tenant?.state].filter(Boolean).join(', ');
}

export function buildReceiptStoreInfo(
  config: ReceiptLayoutConfig,
  tenant?: Pick<TenantProfile, 'name' | 'address' | 'phone' | 'city' | 'state'> | null,
  fallbackName?: string,
): ReceiptStoreInfo {
  const address = buildTenantAddress(tenant);

  return {
    storeName: config.showStoreName ? tenant?.name || fallbackName : undefined,
    storeAddress: config.showStoreAddress && address ? address : undefined,
    storePhone: config.showStorePhone && tenant?.phone ? tenant.phone : undefined,
  };
}
