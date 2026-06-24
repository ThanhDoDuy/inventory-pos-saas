export const NOTIFICATION_LATEST_LIMIT = 5;
export const NOTIFICATION_POLL_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes

export function resolveNotificationRedirectUrl(
  redirectUrl?: string,
  type?: string,
  payload?: Record<string, unknown>,
): string {
  if (redirectUrl) {
    return redirectUrl;
  }
  if (!type || !payload) {
    return '';
  }

  switch (type) {
    case 'LOW_STOCK': {
      const productId = payload.productId ?? payload.product_id;
      return productId ? `/dashboard/products/${String(productId)}` : '';
    }
    case 'PO_RECEIVED': {
      const poId = payload.purchaseOrderId ?? payload.purchase_order_id ?? payload.poId;
      return poId ? `/dashboard/purchase-orders/${String(poId)}` : '';
    }
    case 'INVOICE_PAID': {
      const invoiceId = payload.invoiceId ?? payload.invoice_id;
      return invoiceId ? `/dashboard/invoices/${String(invoiceId)}` : '';
    }
    default:
      return '';
  }
}

export function mergeNotificationItems<T extends { id: string }>(
  ...groups: T[][]
): T[] {
  const map = new Map<string, T>();
  for (const group of groups) {
    for (const item of group) {
      map.set(item.id, item);
    }
  }
  return [...map.values()];
}
