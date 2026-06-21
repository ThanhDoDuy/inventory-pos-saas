import { useEffect, useMemo } from 'react';
import { usePriceTiers } from '@/hooks/use-price-tiers';
import type { CartState } from '@/lib/cart-store';
import { RETAIL_TIER_CODE } from '@/lib/price-input';

export function useOrderPriceTier(cart: Pick<
  CartState,
  'orderPriceTierCode' | 'orderPriceTierLabel' | 'setOrderPriceTier'
>) {
  const { tiers, isLoading } = usePriceTiers();

  const activeTiers = useMemo(
    () => tiers.filter((tier) => tier.is_active),
    [tiers],
  );

  useEffect(() => {
    if (!activeTiers.length) {
      return;
    }

    const matched = activeTiers.find((tier) => tier.code === cart.orderPriceTierCode);
    if (matched) {
      if (matched.label !== cart.orderPriceTierLabel) {
        cart.setOrderPriceTier(matched.code, matched.label);
      }
      return;
    }

    const retailTier =
      activeTiers.find((tier) => tier.code === RETAIL_TIER_CODE) ?? activeTiers[0];
    cart.setOrderPriceTier(retailTier.code, retailTier.label);
  }, [activeTiers, cart.orderPriceTierCode, cart.orderPriceTierLabel, cart.setOrderPriceTier]);

  const selectedTier = useMemo(
    () =>
      activeTiers.find((tier) => tier.code === cart.orderPriceTierCode) ??
      activeTiers.find((tier) => tier.code === RETAIL_TIER_CODE) ??
      activeTiers[0],
    [activeTiers, cart.orderPriceTierCode],
  );

  const setOrderTier = (tierCode: string) => {
    const tier = activeTiers.find((item) => item.code === tierCode);
    if (tier) {
      cart.setOrderPriceTier(tier.code, tier.label);
    }
  };

  return {
    activeTiers,
    isLoading,
    selectedTier,
    setOrderTier,
    orderPriceTierLabel: cart.orderPriceTierLabel || selectedTier?.label || '',
  };
}
