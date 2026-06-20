import type { Locale } from './messages';
import { tMessage } from './get-message';

export interface ReceiptLabels {
  defaultStoreName: string;
  invoiceTitle: string;
  documentTitle: string;
  phonePrefix: string;
  customerLabel: string;
  taxCodeLabel: string;
  codeLabel: string;
  columns: {
    product: string;
    qty: string;
    unitPrice: string;
    lineTotal: string;
  };
  subtotal: string;
  discount: string;
  tax: string;
  grandTotal: string;
  payment: string;
  amountPaid: string;
  change: string;
  notes: string;
  thankYou: string;
  printInitFailed: string;
  paymentMethods: Record<string, string>;
}

export function getReceiptLabels(locale?: Locale): ReceiptLabels {
  const t = (key: string, params?: Record<string, string | number>) =>
    tMessage(key, params, locale);

  return {
    defaultStoreName: t('receipt.defaultStoreName'),
    invoiceTitle: t('receipt.invoiceTitle'),
    documentTitle: t('receipt.documentTitle'),
    phonePrefix: t('receipt.phonePrefix'),
    customerLabel: t('receipt.customerLabel'),
    taxCodeLabel: t('receipt.taxCodeLabel'),
    codeLabel: t('receipt.codeLabel'),
    columns: {
      product: t('receipt.columns.product'),
      qty: t('receipt.columns.qty'),
      unitPrice: t('receipt.columns.unitPrice'),
      lineTotal: t('receipt.columns.lineTotal'),
    },
    subtotal: t('receipt.subtotal'),
    discount: t('receipt.discount'),
    tax: t('receipt.tax'),
    grandTotal: t('receipt.grandTotal'),
    payment: t('receipt.payment'),
    amountPaid: t('receipt.amountPaid'),
    change: t('receipt.change'),
    notes: t('receipt.notes'),
    thankYou: t('receipt.thankYou'),
    printInitFailed: t('receipt.printInitFailed'),
    paymentMethods: {
      CASH: t('receipt.paymentMethods.CASH'),
      BANK_TRANSFER: t('receipt.paymentMethods.BANK_TRANSFER'),
      CARD: t('receipt.paymentMethods.CARD'),
      E_WALLET: t('receipt.paymentMethods.E_WALLET'),
    },
  };
}

export function getUnnamedProductLabel(locale?: Locale): string {
  return tMessage('receipt.unnamedProduct', undefined, locale);
}
