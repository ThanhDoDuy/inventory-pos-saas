'use client';

import { X } from 'lucide-react';
import type { PriceTierItem } from '@/hooks/use-price-tiers';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

interface PriceTierModalProps {
  isOpen: boolean;
  productName: string;
  quantity: number;
  tiers: PriceTierItem[];
  prices: Record<string, number>;
  onSelect: (tier: PriceTierItem, unitPrice: number) => void;
  onClose: () => void;
}

export function PriceTierModal({
  isOpen,
  productName,
  quantity,
  tiers,
  prices,
  onSelect,
  onClose,
}: PriceTierModalProps) {
  const { t } = useTranslation();
  const { formatMoney } = useFormat();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={t('pos.priceTier.close')}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <div className="relative bg-card rounded-2xl border border-border shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-lg font-bold text-foreground">{t('pos.priceTier.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {productName} · {t('pos.priceTier.qty', { count: quantity })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
          {tiers.map((tier) => {
            const unitPrice = prices[tier.code] ?? prices.RETAIL ?? 0;
            return (
              <button
                key={tier.code}
                type="button"
                onClick={() => onSelect(tier, unitPrice)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/5 transition-colors text-left"
              >
                <span className="font-semibold text-foreground">{tier.label}</span>
                <span className="font-bold text-primary">{formatMoney(unitPrice)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
