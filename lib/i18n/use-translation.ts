'use client';

import { useCallback } from 'react';
import { useLocaleStore } from '@/lib/locale-store';
import type { Locale } from './messages';
import { MESSAGES } from './messages';
import { translateParams } from './translate';

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const messages = MESSAGES[locale];

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translateParams(messages, key, params),
    [messages],
  );

  return { t, locale };
}

export function useFormat() {
  const { locale, t } = useTranslation();
  const numberLocale = locale === 'en' ? 'en-US' : 'vi-VN';

  const formatPrice = useCallback(
    (value: number) => new Intl.NumberFormat(numberLocale).format(value),
    [numberLocale],
  );

  const formatMoney = useCallback(
    (value: number) => {
      const formatted = new Intl.NumberFormat(numberLocale).format(value);
      return locale === 'en' ? `${formatted} VND` : `${formatted}₫`;
    },
    [numberLocale, locale],
  );

  const formatDateTime = useCallback(
    (value?: string) => {
      if (!value) return '—';
      return new Intl.DateTimeFormat(numberLocale, {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(value));
    },
    [numberLocale],
  );

  const getPoStatusLabel = useCallback(
    (status?: string) => {
      if (!status) return '—';
      const key = `status.po.${status}`;
      const label = t(key);
      return label === key ? status : label;
    },
    [t],
  );

  const getPartyStatusLabel = useCallback(
    (status?: string) => {
      if (!status) return '—';
      const key = `status.party.${status}`;
      const label = t(key);
      return label === key ? status : label;
    },
    [t],
  );

  const getAdjustmentReasonLabel = useCallback(
    (reason?: string) => {
      if (!reason) return '—';
      const key = `status.adjustment.${reason}`;
      const label = t(key);
      return label === key ? reason : label;
    },
    [t],
  );

  const getTransactionTypeLabel = useCallback(
    (type?: string) => {
      if (!type) return '—';
      const key = `status.transaction.${type}`;
      const label = t(key);
      return label === key ? type : label;
    },
    [t],
  );

  const getStockStatus = useCallback(
    (stock: number, minimumStock = 0) => {
      if (stock <= 0) return t('status.stock.out');
      if (stock <= minimumStock) return t('status.stock.low');
      return t('status.stock.in');
    },
    [t],
  );

  return {
    locale,
    formatPrice,
    formatMoney,
    formatDateTime,
    getPoStatusLabel,
    getPartyStatusLabel,
    getAdjustmentReasonLabel,
    getTransactionTypeLabel,
    getStockStatus,
  };
}

export type { Locale };
