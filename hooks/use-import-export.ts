import { downloadFile, apiPost, apiPostForm, extractErrorMessage } from '@/lib/api-client';

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function downloadProductsExport(params?: {
  search?: string;
  category_id?: string;
  status?: string;
}) {
  const query: Record<string, string> = { format: 'csv' };
  if (params?.search) query.search = params.search;
  if (params?.category_id) query.category_id = params.category_id;
  if (params?.status && params.status !== 'all') query.status = params.status;

  await downloadFile('/products/export', `products-export-${dateStamp()}.csv`, query);
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
}) {
  const query: Record<string, string> = { format: 'csv' };
  if (params?.search) query.search = params.search;
  if (params?.status && params.status !== 'all') query.status = params.status;

  await downloadFile('/suppliers/export', `suppliers-export-${dateStamp()}.csv`, query);
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
    throw new Error(extractErrorMessage(error, 'Không thể xem trước file import'));
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
    throw new Error(extractErrorMessage(error, 'Không thể import sản phẩm'));
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
    throw new Error(extractErrorMessage(error, 'Không thể xem trước file import'));
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
    throw new Error(extractErrorMessage(error, 'Không thể import nhà cung cấp'));
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
    throw new Error(extractErrorMessage(error, 'Không thể xem trước file import'));
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
    throw new Error(extractErrorMessage(error, 'Không thể import khách hàng'));
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
    throw new Error(extractErrorMessage(error, 'Không thể xem trước file import'));
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
    throw new Error(extractErrorMessage(error, 'Không thể import đơn mua hàng'));
  }
}
