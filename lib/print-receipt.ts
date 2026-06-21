import type { Locale } from '@/lib/i18n/messages';
import { getStoredLocale } from '@/lib/i18n/get-message';
import { getReceiptLabels, type ReceiptLabels } from '@/lib/i18n/receipt-labels';

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface ReceiptCustomer {
  name: string;
  taxCode?: string;
  address?: string;
  phone?: string;
}

export interface ReceiptData {
  invoiceNumber: string;
  createdAt?: string;
  storeName?: string;
  storeAddress?: string;
  storePhone?: string;
  customer?: ReceiptCustomer;
  items: ReceiptLineItem[];
  subtotal: number;
  discountPercent: number;
  tax: number;
  total: number;
  paymentMethod: string;
  amountPaid?: number;
  change?: number;
  notes?: string;
}

function formatReceiptMoney(value: number, locale: Locale) {
  const numberLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  const formatted = new Intl.NumberFormat(numberLocale).format(value);
  return locale === 'en' ? `${formatted} VND` : `${formatted}₫`;
}

function formatReceiptDateTime(value: string, locale: Locale) {
  const numberLocale = locale === 'en' ? 'en-US' : 'vi-VN';
  return new Intl.DateTimeFormat(numberLocale, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function paymentLabel(method: string, labels: ReceiptLabels) {
  return labels.paymentMethods[method.toUpperCase()] ?? method;
}

function buildCustomerBlock(customer: ReceiptCustomer, labels: ReceiptLabels): string {
  return `
  <div class="customer-block">
    <div class="meta"><strong>${escapeHtml(labels.customerLabel)}</strong> ${escapeHtml(customer.name)}</div>
    ${
      customer.taxCode
        ? `<div class="meta"><strong>${escapeHtml(labels.taxCodeLabel)}</strong> ${escapeHtml(customer.taxCode)}</div>`
        : ''
    }
    ${
      customer.address
        ? `<div class="meta">${escapeHtml(customer.address)}</div>`
        : ''
    }
    ${
      customer.phone
        ? `<div class="meta">${escapeHtml(labels.phonePrefix)} ${escapeHtml(customer.phone)}</div>`
        : ''
    }
  </div>
  <div class="divider"></div>`;
}

function buildReceiptHtml(data: ReceiptData, labels: ReceiptLabels, locale: Locale): string {
  const discountAmount = Math.round(data.subtotal * (data.discountPercent / 100));
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td class="item-name">${escapeHtml(item.name)}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-price">${formatReceiptMoney(item.unitPrice, locale)}</td>
        <td class="item-total">${formatReceiptMoney(item.total, locale)}</td>
      </tr>`,
    )
    .join('');

  const htmlLang = locale === 'en' ? 'en' : 'vi';
  const dateLocale = locale === 'en' ? 'en-US' : 'vi-VN';

  return `<!DOCTYPE html>
<html lang="${htmlLang}">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.documentTitle.replace('{number}', data.invoiceNumber))}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      font-size: 12px;
      color: #111;
      padding: 16px;
      max-width: 80mm;
      margin: 0 auto;
    }
    .center { text-align: center; }
    .store { font-size: 16px; font-weight: 700; margin-bottom: 4px; }
    .meta { color: #555; font-size: 11px; margin-bottom: 12px; }
    .customer-block .meta { margin-bottom: 4px; text-align: left; }
    .divider { border-top: 1px dashed #999; margin: 10px 0; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      font-size: 10px;
      color: #666;
      padding-bottom: 4px;
      border-bottom: 1px solid #ddd;
    }
    th:nth-child(2), th:nth-child(3), th:nth-child(4),
    td:nth-child(2), td:nth-child(3), td:nth-child(4) { text-align: right; }
    td { padding: 6px 0; vertical-align: top; font-size: 11px; }
    .item-name { max-width: 120px; word-break: break-word; }
    .summary { margin-top: 8px; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
      font-size: 11px;
    }
    .summary-row.total {
      font-size: 14px;
      font-weight: 700;
      border-top: 1px solid #111;
      margin-top: 6px;
      padding-top: 8px;
    }
    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    @media print {
      body { padding: 0; }
      @page { margin: 4mm; size: 80mm auto; }
    }
  </style>
</head>
<body>
  <div class="center">
    ${
      data.storeName
        ? `<div class="store">${escapeHtml(data.storeName)}</div>`
        : ''
    }
    ${
      data.storeAddress
        ? `<div class="meta">${escapeHtml(data.storeAddress)}</div>`
        : ''
    }
    ${
      data.storePhone
        ? `<div class="meta">${escapeHtml(labels.phonePrefix)} ${escapeHtml(data.storePhone)}</div>`
        : ''
    }
    <div class="meta">${escapeHtml(labels.invoiceTitle)}</div>
  </div>
  <div class="meta center">
    ${escapeHtml(labels.codeLabel)} <strong>${escapeHtml(data.invoiceNumber)}</strong><br/>
    ${
      data.createdAt
        ? formatReceiptDateTime(data.createdAt, locale)
        : new Date().toLocaleString(dateLocale)
    }
  </div>
  ${data.customer ? buildCustomerBlock(data.customer, labels) : '<div class="divider"></div>'}
  <table>
    <thead>
      <tr>
        <th>${escapeHtml(labels.columns.product)}</th>
        <th>${escapeHtml(labels.columns.qty)}</th>
        <th>${escapeHtml(labels.columns.unitPrice)}</th>
        <th>${escapeHtml(labels.columns.lineTotal)}</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="divider"></div>
  <div class="summary">
    <div class="summary-row"><span>${escapeHtml(labels.subtotal)}</span><span>${formatReceiptMoney(data.subtotal, locale)}</span></div>
    ${
      data.discountPercent > 0
        ? `<div class="summary-row"><span>${escapeHtml(labels.discount.replace('{percent}', String(data.discountPercent)))}</span><span>-${formatReceiptMoney(discountAmount, locale)}</span></div>`
        : ''
    }
    ${
      data.tax > 0
        ? `<div class="summary-row"><span>${escapeHtml(labels.tax)}</span><span>${formatReceiptMoney(data.tax, locale)}</span></div>`
        : ''
    }
    <div class="summary-row total"><span>${escapeHtml(labels.grandTotal)}</span><span>${formatReceiptMoney(data.total, locale)}</span></div>
    <div class="summary-row"><span>${escapeHtml(labels.payment)}</span><span>${paymentLabel(data.paymentMethod, labels)}</span></div>
    ${
      data.amountPaid !== undefined
        ? `<div class="summary-row"><span>${escapeHtml(labels.amountPaid)}</span><span>${formatReceiptMoney(data.amountPaid, locale)}</span></div>`
        : ''
    }
    ${
      data.change !== undefined && data.change > 0
        ? `<div class="summary-row"><span>${escapeHtml(labels.change)}</span><span>${formatReceiptMoney(data.change, locale)}</span></div>`
        : ''
    }
  </div>
  ${
    data.notes
      ? `<div class="divider"></div><div class="meta">${escapeHtml(labels.notes)} ${escapeHtml(data.notes)}</div>`
      : ''
  }
  <div class="footer">${escapeHtml(labels.thankYou)}</div>
</body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printReceipt(
  data: ReceiptData,
  options?: { labels?: ReceiptLabels; locale?: Locale },
) {
  const locale = options?.locale ?? getStoredLocale();
  const labels = options?.labels ?? getReceiptLabels(locale);
  const html = buildReceiptHtml(data, labels, locale);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'print-receipt');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    document.body.removeChild(iframe);
    throw new Error(labels.printInitFailed);
  }

  doc.open();
  doc.write(html);
  doc.close();

  const cleanup = () => {
    if (iframe.parentNode) {
      document.body.removeChild(iframe);
    }
  };

  const triggerPrint = () => {
    win.focus();
    win.print();
    win.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(cleanup, 2000);
  };

  if (doc.readyState === 'complete') {
    triggerPrint();
  } else {
    iframe.onload = triggerPrint;
    setTimeout(triggerPrint, 500);
  }
}
