import type { WheelEvent } from 'react';

export const RETAIL_TIER_CODE = 'RETAIL';

/** Parse VND price as a whole integer (no floating-point drift). */
export function parsePriceInteger(value: string | number | undefined | null): number {
  if (value === undefined || value === null || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? Math.round(value) : 0;
  }

  const normalized = value.trim();
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

export function excludeRetailTier<T extends { code: string }>(tiers: T[]): T[] {
  return tiers.filter((tier) => tier.code !== RETAIL_TIER_CODE);
}

export function buildProductPrices(
  sellingPrice: string | number,
  tierPrices: Record<string, string | number>,
  tiers: { code: string }[],
): Record<string, number> {
  const retail = parsePriceInteger(sellingPrice);
  const prices: Record<string, number> = { [RETAIL_TIER_CODE]: retail };

  for (const tier of excludeRetailTier(tiers)) {
    prices[tier.code] = parsePriceInteger(tierPrices[tier.code] ?? retail);
  }

  return prices;
}

/** Prevent mouse wheel from changing focused number inputs (common 40000 → 39999 bug). */
export function blurOnWheel(event: WheelEvent<HTMLInputElement>): void {
  event.currentTarget.blur();
}

export const vndPriceInputProps = {
  type: 'number' as const,
  step: 1,
  min: 0,
  onWheel: blurOnWheel,
};
