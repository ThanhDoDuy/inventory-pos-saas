export function formatPrice(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value);
}

export function formatMoney(value: number) {
  return `${formatPrice(value)} VND`;
}

export function stringifyId(id: unknown): string {
  if (!id) return '';
  if (typeof id === 'string') return id;
  if (typeof id === 'object' && id !== null && '_id' in id) {
    return stringifyId((id as { _id: unknown })._id);
  }
  return String(id);
}

export function getStockStatus(stock: number, minimumStock = 0) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

export function getStockStatusColor(status: string) {
  switch (status) {
    case 'In Stock':
      return 'bg-green-100 text-green-800';
    case 'Low Stock':
      return 'bg-yellow-100 text-yellow-800';
    case 'Out of Stock':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getRoleColor(code?: string) {
  switch (code?.toUpperCase()) {
    case 'ADMIN':
      return 'bg-red-100 text-red-800';
    case 'MANAGER':
      return 'bg-blue-100 text-blue-800';
    case 'STAFF':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export type DateRangePreset = 'week' | 'month' | 'quarter' | 'year';

export function getDateRange(preset: DateRangePreset) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);

  const from = new Date();
  from.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'week':
      from.setDate(from.getDate() - 7);
      break;
    case 'month':
      from.setMonth(from.getMonth() - 1);
      break;
    case 'quarter':
      from.setMonth(from.getMonth() - 3);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
  }

  // Normalized to start/end of day so SWR cache keys stay stable between renders.
  return { from: from.toISOString(), to: to.toISOString() };
}

export function formatDateTime(value?: string) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Nháp',
  APPROVED: 'Đã duyệt',
  PARTIALLY_RECEIVED: 'Nhận một phần',
  RECEIVED: 'Đã nhận',
  CANCELLED: 'Đã hủy',
};

export function getPoStatusLabel(status?: string) {
  if (!status) return '—';
  return PO_STATUS_LABELS[status] ?? status;
}

export function getPoStatusColor(status?: string) {
  switch (status) {
    case 'DRAFT':
      return 'bg-gray-100 text-gray-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'PARTIALLY_RECEIVED':
      return 'bg-yellow-100 text-yellow-800';
    case 'RECEIVED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

const PARTY_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Hoạt động',
  DISABLED: 'Vô hiệu',
};

export function getPartyStatusLabel(status?: string) {
  if (!status) return '—';
  return PARTY_STATUS_LABELS[status] ?? status;
}

const ADJUSTMENT_REASON_LABELS: Record<string, string> = {
  DAMAGE: 'Hư hỏng',
  LOSS: 'Thất thoát',
  EXPIRED: 'Hết hạn',
  CORRECTION: 'Điều chỉnh',
};

export function getAdjustmentReasonLabel(reason?: string) {
  if (!reason) return '—';
  return ADJUSTMENT_REASON_LABELS[reason] ?? reason;
}

const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  IN: 'Nhập',
  OUT: 'Xuất',
  ADJUST: 'Điều chỉnh',
};

export function getTransactionTypeLabel(type?: string) {
  if (!type) return '—';
  return TRANSACTION_TYPE_LABELS[type] ?? type;
}
