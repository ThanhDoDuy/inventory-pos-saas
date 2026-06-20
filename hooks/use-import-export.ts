import { downloadFile, apiPost, apiPostForm, extractErrorMessage } from '@/lib/api-client';
import { tMessage } from '@/lib/i18n/get-message';

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function downloadProductsExport(params?: {
  search?: string;
  category_id?: string;
  status?: string;
  all?: boolean;
}) {
  const query: Record<string, string> = { format: 'xlsx' };
  if (params?.all) {
    query.all = 'true';
  } else {
    if (params?.search) query.search = params.search;
    if (params?.category_id) query.category_id = params.category_id;
    if (params?.status && params.status !== 'all') query.status = params.status;
  }

  const suffix = params?.all ? 'all' : 'filtered';
  await downloadFile(
    '/products/export',
    `products-export-${suffix}-${dateStamp()}.xlsx`,
    query,
  );
}

export async function downloadProductsTemplate() {
  await downloadFile(
    '/products/export/template',
    'products-import-template.xlsx',
  );
}

export async function downloadSuppliersExport(params?: {
  search?: string;
  status?: string;
  all?: boolean;
}) {
  const query: Record<string, string> = { format: 'xlsx' };
  if (params?.all) {
    query.all = 'true';
  } else {
    if (params?.search) query.search = params.search;
    if (params?.status && params.status !== 'all') query.status = params.status;
  }

  const suffix = params?.all ? 'all' : 'filtered';
  await downloadFile(
    '/suppliers/export',
    `suppliers-export-${suffix}-${dateStamp()}.xlsx`,
    query,
  );
}

export async function downloadSuppliersTemplate() {
  await downloadFile(
    '/suppliers/export/template',
    'suppliers-import-template.xlsx',
  );
}

export async function downloadCustomersExport(params?: {
  search?: string;
  status?: string;
  customer_type?: string;
}) {
  const query: Record<string, string> = { format: 'csv' };
  if (params?.search) query.search = params.search;
  if (params?.status && params.status !== 'all') query.status = params.status;
  if (params?.customer_type && params.customer_type !== 'all') {
    query.customer_type = params.customer_type;
  }

  await downloadFile('/customers/export', `customers-export-${dateStamp()}.csv`, query);
}

export async function downloadCustomersTemplate() {
  await downloadFile(
    '/customers/export/template',
    'customers-import-template.xlsx',
  );
}

const IMPORT_FILE_EXTENSIONS = ['.csv', '.xlsx'];

export function isAllowedImportFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return IMPORT_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export interface ProductImportPreviewRow {
  line: number;
  sku: string;
  name: string;
  action?: 'CREATE' | 'UPDATE';
  status: 'OK' | 'ERROR';
  categoryName?: string;
  categoryAction?: 'NONE' | 'EXISTING' | 'WILL_CREATE';
  errors: string[];
}

export interface ProductImportPreviewResult {
  previewToken: string;
  expiresInSeconds: number;
  summary: {
    total: number;
    valid: number;
    errors: number;
    categoriesToCreate: number;
  };
  rows: ProductImportPreviewRow[];
}

export async function previewProductsImport(
  file: File,
  mode: 'create_only' | 'upsert' = 'upsert',
) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await apiPostForm<ProductImportPreviewResult>(
      '/products/import/preview',
      formData,
      { mode },
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.previewFailed')));
  }
}

export async function confirmProductsImport(previewToken: string) {
  try {
    return await apiPost<{
      created: number;
      updated: number;
      failed: number;
      skipped: number;
      failures: Array<{ line: number; sku: string; message: string }>;
    }>('/products/import/confirm', { previewToken });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.importFailed')));
  }
}

export interface SupplierImportPreviewRow {
  line: number;
  phone: string;
  name: string;
  action?: 'CREATE' | 'UPDATE';
  status: 'OK' | 'ERROR';
  errors: string[];
}

export interface SupplierImportPreviewResult {
  previewToken: string;
  expiresInSeconds: number;
  summary: { total: number; valid: number; errors: number };
  rows: SupplierImportPreviewRow[];
}

export async function previewSuppliersImport(
  file: File,
  mode: 'create_only' | 'upsert' = 'upsert',
) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await apiPostForm<SupplierImportPreviewResult>(
      '/suppliers/import/preview',
      formData,
      { mode },
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.previewFailed')));
  }
}

export async function confirmSuppliersImport(previewToken: string) {
  try {
    return await apiPost<{
      created: number;
      updated: number;
      failed: number;
      skipped: number;
      failures: Array<{ line: number; phone: string; message: string }>;
    }>('/suppliers/import/confirm', { previewToken });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.importSuppliersFailed')));
  }
}

export interface CustomerImportPreviewRow {
  line: number;
  customer_type: string;
  phone: string;
  name: string;
  tax_code?: string;
  action?: 'CREATE' | 'UPDATE';
  status: 'OK' | 'ERROR';
  errors: string[];
}

export interface CustomerImportPreviewResult {
  previewToken: string;
  expiresInSeconds: number;
  summary: { total: number; valid: number; errors: number };
  rows: CustomerImportPreviewRow[];
}

export async function previewCustomersImport(
  file: File,
  mode: 'create_only' | 'upsert' = 'upsert',
) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await apiPostForm<CustomerImportPreviewResult>(
      '/customers/import/preview',
      formData,
      { mode },
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.previewFailed')));
  }
}

export async function confirmCustomersImport(previewToken: string) {
  try {
    return await apiPost<{
      created: number;
      updated: number;
      failed: number;
      skipped: number;
      failures: Array<{ line: number; phone: string; message: string }>;
    }>('/customers/import/confirm', { previewToken });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.importCustomersFailed')));
  }
}

export async function downloadPurchaseOrdersTemplate() {
  await downloadFile(
    '/purchase-orders/export/template',
    'purchase-orders-import-template.xlsx',
  );
}

export interface PoImportPreviewRow {
  line: number;
  poGroup: string;
  supplierPhone: string;
  productSku: string;
  quantity: number;
  status: 'OK' | 'ERROR';
  errors: string[];
}

export interface PoImportPreviewResult {
  previewToken: string;
  expiresInSeconds: number;
  summary: {
    total: number;
    valid: number;
    errors: number;
    ordersToCreate: number;
  };
  rows: PoImportPreviewRow[];
}

export async function previewPurchaseOrdersImport(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  try {
    return await apiPostForm<PoImportPreviewResult>(
      '/purchase-orders/import/preview',
      formData,
    );
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.previewFailed')));
  }
}

export async function confirmPurchaseOrdersImport(previewToken: string) {
  try {
    return await apiPost<{
      created: number;
      failed: number;
      skipped: number;
      failures: Array<{ poGroup: string; message: string }>;
    }>('/purchase-orders/import/confirm', { previewToken });
  } catch (error) {
    throw new Error(extractErrorMessage(error, tMessage('importExport.error.importPurchaseOrdersFailed')));
  }
}

export async function downloadInvoicesExport(params?: {
  from?: string;
  to?: string;
  status?: string;
  export_type?: 'summary' | 'detail';
}) {
  const query: Record<string, string> = {};
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  if (params?.status && params.status !== 'all') query.status = params.status;
  if (params?.export_type) query.export_type = params.export_type;

  const suffix = params?.export_type === 'detail' ? 'detail' : 'summary';
  await downloadFile(
    '/invoices/export',
    `invoices-export-${suffix}-${dateStamp()}.csv`,
    query,
  );
}

export async function downloadPurchaseOrdersExport(params?: {
  status?: string;
  supplierId?: string;
  from?: string;
  to?: string;
  export_type?: 'summary' | 'detail';
}) {
  const query: Record<string, string> = {};
  if (params?.status && params.status !== 'all') query.status = params.status;
  if (params?.supplierId) query.supplierId = params.supplierId;
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;
  if (params?.export_type) query.export_type = params.export_type;

  const suffix = params?.export_type === 'detail' ? 'detail' : 'summary';
  await downloadFile(
    '/purchase-orders/export',
    `purchase-orders-export-${suffix}-${dateStamp()}.csv`,
    query,
  );
}

export async function downloadInventoryBalancesExport(params?: {
  search?: string;
  category_id?: string;
  status?: string;
  low_stock_only?: boolean;
}) {
  const query: Record<string, string> = {};
  if (params?.search) query.search = params.search;
  if (params?.category_id) query.category_id = params.category_id;
  if (params?.status && params.status !== 'all') query.status = params.status;
  if (params?.low_stock_only) query.low_stock_only = 'true';

  await downloadFile(
    '/inventory/export/balances',
    `inventory-balances-export-${dateStamp()}.csv`,
    query,
  );
}

export async function downloadInventoryTransactionsExport(params?: {
  productId?: string;
  type?: string;
  from?: string;
  to?: string;
}) {
  const query: Record<string, string> = {};
  if (params?.productId) query.productId = params.productId;
  if (params?.type) query.type = params.type;
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;

  await downloadFile(
    '/inventory/export/transactions',
    `inventory-transactions-export-${dateStamp()}.csv`,
    query,
  );
}

export async function downloadAuditLogsExport(params?: {
  userId?: string;
  action?: string;
  module?: string;
  from?: string;
  to?: string;
}) {
  const query: Record<string, string> = { format: 'csv' };
  if (params?.userId) query.userId = params.userId;
  if (params?.action && params.action !== 'all') query.action = params.action;
  if (params?.module && params.module !== 'all') query.module = params.module;
  if (params?.from) query.from = params.from;
  if (params?.to) query.to = params.to;

  await downloadFile('/audit-logs/export', `audit-logs-export-${dateStamp()}.csv`, query);
}
