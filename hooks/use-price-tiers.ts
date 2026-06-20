import { useMemo } from 'react';
import useSWR from 'swr';
import { apiGet, apiPatch, apiPost, extractErrorMessage } from '@/lib/api-client';
import { stringifyId } from '@/lib/format';
import { tMessage } from '@/lib/i18n/get-message';

export interface PriceTierItem {
  id: string;
  code: string;
  label: string;
  is_system: boolean;
  is_active: boolean;
  sort_order: number;
}

function mapPriceTier(raw: Record<string, unknown>): PriceTierItem {
  return {
    id: stringifyId(raw.id ?? raw._id),
    code: String(raw.code ?? ''),
    label: String(raw.label ?? ''),
    is_system: Boolean(raw.is_system),
    is_active: Boolean(raw.is_active),
    sort_order: Number(raw.sort_order ?? 0),
  };
}

export function usePriceTiers() {
  const { data, error, isLoading, mutate } = useSWR<Record<string, unknown>[]>(
    '/price-tiers',
    apiGet<Record<string, unknown>[]>,
    { revalidateOnFocus: false },
  );

  const tiers = useMemo(
    () => (data ?? []).map((item) => mapPriceTier(item)),
    [data],
  );

  return { tiers, isLoading, error, mutate };
}

export async function createPriceTier(payload: { code: string; label: string }) {
  try {
    const raw = await apiPost<Record<string, unknown>>('/price-tiers', payload);
    return mapPriceTier(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('settings.priceTiers.error')));
  }
}

export async function updatePriceTier(
  code: string,
  payload: { label?: string; is_active?: boolean },
) {
  try {
    const raw = await apiPatch<Record<string, unknown>>(`/price-tiers/${code}`, payload);
    return mapPriceTier(raw);
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('settings.priceTiers.error')));
  }
}
