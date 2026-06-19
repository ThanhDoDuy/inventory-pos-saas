import { formatDateTime, formatMoney } from '@/lib/format';

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

const PAYMENT_LABELS: Record<string, string> = {
  CASH: 'Tiền mặt',
  BANK_TRANSFER: 'Chuyển khoản',
  CARD: 'Thẻ',
  E_WALLET: 'Ví điện tử',
};

function paymentLabel(method: string) {
  return PAYMENT_LABELS[method.toUpperCase()] ?? method;
}

function buildCustomerBlock(customer: ReceiptCustomer): string {
  return `
  <div class="customer-block">
    <div class="meta"><strong>Khách hàng:</strong> ${escapeHtml(customer.name)}</div>
    ${
      customer.taxCode
        ? `<div class="meta"><strong>MST:</strong> ${escapeHtml(customer.taxCode)}</div>`
        : ''
    }
    ${
      customer.address
        ? `<div class="meta">${escapeHtml(customer.address)}</div>`
        : ''
    }
    ${
      customer.phone
        ? `<div class="meta">ĐT: ${escapeHtml(customer.phone)}</div>`
        : ''
    }
  </div>
  <div class="divider"></div>`;
}

function buildReceiptHtml(data: ReceiptData): string {
  const discountAmount = Math.round(data.subtotal * (data.discountPercent / 100));
  const rows = data.items
    .map(
      (item) => `
      <tr>
        <td class="item-name">${escapeHtml(item.name)}</td>
        <td class="item-qty">${item.quantity}</td>
        <td class="item-price">${formatMoney(item.unitPrice)}</td>
        <td class="item-total">${formatMoney(item.total)}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Hóa đơn ${escapeHtml(data.invoiceNumber)}</title>
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
    <div class="store">${escapeHtml(data.storeName ?? 'Cửa hàng')}</div>
    ${
      data.storeAddress
        ? `<div class="meta">${escapeHtml(data.storeAddress)}</div>`
        : ''
    }
    ${
      data.storePhone
        ? `<div class="meta">ĐT: ${escapeHtml(data.storePhone)}</div>`
        : ''
    }
    <div class="meta">HÓA ĐƠN BÁN HÀNG</div>
  </div>
  <div class="meta center">
    Mã: <strong>${escapeHtml(data.invoiceNumber)}</strong><br/>
    ${data.createdAt ? formatDateTime(data.createdAt) : new Date().toLocaleString('vi-VN')}
  </div>
  ${data.customer ? buildCustomerBlock(data.customer) : '<div class="divider"></div>'}
  <table>
    <thead>
      <tr>
        <th>Sản phẩm</th>
        <th>SL</th>
        <th>Đơn giá</th>
        <th>TT</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="divider"></div>
  <div class="summary">
    <div class="summary-row"><span>Tạm tính</span><span>${formatMoney(data.subtotal)}</span></div>
    ${
      data.discountPercent > 0
        ? `<div class="summary-row"><span>Giảm giá (${data.discountPercent}%)</span><span>-${formatMoney(discountAmount)}</span></div>`
        : ''
    }
    ${
      data.tax > 0
        ? `<div class="summary-row"><span>Thuế</span><span>${formatMoney(data.tax)}</span></div>`
        : ''
    }
    <div class="summary-row total"><span>Tổng cộng</span><span>${formatMoney(data.total)}</span></div>
    <div class="summary-row"><span>Thanh toán</span><span>${paymentLabel(data.paymentMethod)}</span></div>
    ${
      data.amountPaid !== undefined
        ? `<div class="summary-row"><span>Khách trả</span><span>${formatMoney(data.amountPaid)}</span></div>`
        : ''
    }
    ${
      data.change !== undefined && data.change > 0
        ? `<div class="summary-row"><span>Tiền thừa</span><span>${formatMoney(data.change)}</span></div>`
        : ''
    }
  </div>
  ${
    data.notes
      ? `<div class="divider"></div><div class="meta">Ghi chú: ${escapeHtml(data.notes)}</div>`
      : ''
  }
  <div class="footer">Cảm ơn quý khách!</div>
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

export function printReceipt(data: ReceiptData) {
  const html = buildReceiptHtml(data);

  const iframe = document.createElement('iframe');
  iframe.setAttribute('title', 'print-receipt');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);

  const win = iframe.contentWindow;
  const doc = win?.document;
  if (!win || !doc) {
    document.body.removeChild(iframe);
    throw new Error('Không thể khởi tạo bản in');
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
