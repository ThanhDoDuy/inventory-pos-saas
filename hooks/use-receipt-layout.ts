import { useMemo } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import {
  buildReceiptStoreInfo,
  parseReceiptLayoutConfig,
  type ReceiptLayoutConfig,
  type ReceiptStoreInfo,
} from '@/lib/receipt-layout';
import { useSettings } from '@/hooks/use-settings';
import { useTenant } from '@/hooks/use-tenant';

export function useReceiptLayout(): {
  config: ReceiptLayoutConfig;
  storeInfo: ReceiptStoreInfo;
  isLoading: boolean;
} {
  const { settings, isLoading: settingsLoading } = useSettings();
  const { tenant, isLoading: tenantLoading } = useTenant();
  const user = useAuthStore((state) => state.user);

  const config = useMemo(() => parseReceiptLayoutConfig(settings), [settings]);
  const storeInfo = useMemo(
    () => buildReceiptStoreInfo(config, tenant, user?.tenantName),
    [config, tenant, user?.tenantName],
  );

  return {
    config,
    storeInfo,
    isLoading: settingsLoading || tenantLoading,
  };
}
