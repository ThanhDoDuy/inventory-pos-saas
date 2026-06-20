'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Package, Plus, Search, Edit2, Trash2, Loader2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import {
  createProduct,
  deactivateProduct,
  useCategories,
  useProducts,
} from '@/hooks/use-inventory';
import {
  downloadProductsExport,
  downloadProductsTemplate,
} from '@/hooks/use-import-export';
import { usePriceTiers } from '@/hooks/use-price-tiers';
import { getStockStatusColor, stringifyId } from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { ProductImportModal } from '@/components/product-import-modal';
import { ProductImagePendingUpload } from '@/components/product-image-pending-upload';
import { ImportExportDropdown } from '@/components/import-export-dropdown';
import { PaginationBar } from '@/components/pagination-bar';
import { useDashboard, useLowStock } from '@/hooks/use-analytics';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';
import { getProductListImageUrl } from '@/lib/cloudinary-url';
import { uploadProductImage } from '@/hooks/use-product-images';

function stockStatusColorKey(stock: number, minimumStock = 0) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

export default function InventoryPage() {
  const { t } = useTranslation();
  const { formatMoney, getStockStatus } = useFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    name: '',
    sku: '',
    category_id: '',
    cost_price: '',
    selling_price: '',
    minimum_stock: '0',
  });
  const [tierPrices, setTierPrices] = useState<Record<string, string>>({});
  const [isExporting, setIsExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [page, setPage] = useState(1);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [imageError, setImageError] = useState('');

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { products, total, pagination, isLoading, error, mutate } = useProducts(
    debouncedSearch.trim() || undefined,
    { page },
  );
  const { categories } = useCategories();
  const { tiers } = usePriceTiers();
  const { dashboard } = useDashboard();
  const { lowStock: lowStockRows } = useLowStock();

  const stats = useMemo(() => {
    const outOfStock = lowStockRows.filter((row) => row.available_quantity <= 0).length;
    return {
      total: total || products.length,
      lowStock: dashboard?.low_stock_count ?? lowStockRows.length,
      outOfStock,
    };
  }, [products.length, total, dashboard?.low_stock_count, lowStockRows]);

  const resetCreateForm = () => {
    setForm({
      name: '',
      sku: '',
      category_id: '',
      cost_price: '',
      selling_price: '',
      minimum_stock: '0',
    });
    setTierPrices({});
    setPendingImages([]);
    setImageError('');
    setFormError('');
  };

  const handleCreate = async () => {
    setFormError('');
    setImageError('');
    if (!form.name || !form.sku || !form.selling_price) {
      setFormError(t('products.error.requiredFields'));
      return;
    }

    setIsSubmitting(true);
    try {
      const retail = Number(form.selling_price);
      const prices = Object.fromEntries(
        tiers.map((tier) => [
          tier.code,
          Number(tierPrices[tier.code] || retail),
        ]),
      );

      const created = (await createProduct({
        name: form.name,
        sku: form.sku,
        cost_price: Number(form.cost_price) || 0,
        selling_price: retail,
        prices,
        minimum_stock: Number(form.minimum_stock) || 0,
        ...(form.category_id ? { category_id: form.category_id } : {}),
      })) as Record<string, unknown>;

      const productId = stringifyId(created.id ?? created._id);
      for (let i = 0; i < pendingImages.length; i++) {
        await uploadProductImage(productId, pendingImages[i], i);
      }

      await mutate();
      setShowAddModal(false);
      resetCreateForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('products.error.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (productId: string, productName: string) => {
    if (!confirm(t('products.confirm.deactivate', { name: productName }))) return;
    try {
      await deactivateProduct(productId);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('products.error.deactivateFailed'));
    }
  };

  const handleExport = async (all = false) => {
    setIsExporting(true);
    try {
      await downloadProductsExport(
        all
          ? { all: true }
          : { search: debouncedSearch.trim() || undefined },
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadTemplate = async () => {
    setIsExporting(true);
    try {
      await downloadProductsTemplate();
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.templateFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('products.title')}</h1>
          <p className="text-muted-foreground">{t('products.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ImportExportDropdown
            label={t('importExport.menu')}
            isBusy={isExporting}
            items={[
              {
                id: 'export-filtered',
                label: t('importExport.exportCsv'),
                icon: <Download size={18} />,
                onClick: () => handleExport(false),
              },
              {
                id: 'export-all',
                label: t('importExport.exportAll'),
                icon: <Download size={18} />,
                onClick: () => handleExport(true),
              },
              {
                id: 'download-template',
                label: t('importExport.downloadTemplate'),
                icon: <FileSpreadsheet size={18} />,
                onClick: handleDownloadTemplate,
              },
              {
                id: 'import',
                label: t('importExport.importCsv'),
                icon: <Upload size={18} />,
                onClick: () => setShowImportModal(true),
              },
            ]}
          />
          <button
            onClick={() => {
              resetCreateForm();
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            {t('products.add')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('products.stats.total')}</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('products.stats.lowStock')}</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('products.stats.outOfStock')}</p>
          <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <FormField label={t('common.search')} htmlFor="product-search">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-muted-foreground shrink-0" />
            <input
              id="product-search"
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${inputClassName} flex-1`}
            />
          </div>
        </FormField>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
            <Loader2 className="animate-spin" size={20} />
            {t('common.loading')}
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">{t('products.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('products.table.product')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('products.table.sku')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">{t('products.table.category')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">{t('products.table.stock')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">{t('products.table.minStock')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">{t('products.table.price')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">{t('products.table.status')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">{t('products.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      {t('products.empty.noProducts')}
                    </td>
                  </tr>
                ) : (
                  products.map((item) => {
                    const minStock = item.minimum_stock ?? 0;
                    const statusLabel = getStockStatus(item.stock, minStock);
                    const statusColorKey = stockStatusColorKey(item.stock, minStock);
                    const thumbUrl = getProductListImageUrl(item.image_url, item.images);
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                              {thumbUrl ? (
                                <Image
                                  src={thumbUrl}
                                  alt={item.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                  unoptimized={!thumbUrl.includes('res.cloudinary.com')}
                                />
                              ) : (
                                <Package size={20} className="text-primary" />
                              )}
                            </div>
                            <span className="font-medium text-foreground">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.sku}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.category?.name ?? t('common.none')}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">{item.stock}</td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {minStock}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {formatMoney(item.selling_price)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(statusColorKey)}`}
                          >
                            {statusLabel}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/dashboard/products/${item.id}`}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-primary"
                            >
                              <Edit2 size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeactivate(item.id, item.name)}
                              className="p-2 hover:bg-secondary rounded-lg transition-colors text-destructive"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar
          pagination={pagination}
          onPageChange={setPage}
          isLoading={isLoading}
        />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">{t('products.modal.add')}</h2>
            {formError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <FormField label={t('products.form.name')} htmlFor="product-name" required>
                <input
                  id="product-name"
                  type="text"
                  placeholder={t('products.placeholders.name')}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('products.form.sku')} htmlFor="product-sku" required hint={t('products.form.skuHint')}>
                <input
                  id="product-sku"
                  type="text"
                  placeholder={t('products.placeholders.sku')}
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('products.form.category')} htmlFor="product-category">
                <select
                  id="product-category"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">{t('products.placeholders.categoryNone')}</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label={t('products.form.costPrice')} htmlFor="product-cost">
                <input
                  id="product-cost"
                  type="number"
                  min={0}
                  placeholder={t('products.placeholders.cost')}
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label={t('products.form.sellingPrice')} htmlFor="product-price" required>
                <input
                  id="product-price"
                  type="number"
                  min={0}
                  placeholder={t('products.placeholders.price')}
                  value={form.selling_price}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({ ...form, selling_price: value });
                    setTierPrices((prev) => ({
                      ...prev,
                      RETAIL: value,
                    }));
                  }}
                  className={inputClassName}
                />
              </FormField>
              {tiers.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-border">
                  <p className="text-sm font-medium text-foreground">{t('products.form.tierPrices')}</p>
                  {tiers.map((tier) => (
                    <FormField key={tier.code} label={tier.label} htmlFor={`tier-${tier.code}`}>
                      <input
                        id={`tier-${tier.code}`}
                        type="number"
                        min={0}
                        value={tierPrices[tier.code] ?? form.selling_price}
                        onChange={(e) =>
                          setTierPrices((prev) => ({
                            ...prev,
                            [tier.code]: e.target.value,
                          }))
                        }
                        className={inputClassName}
                      />
                    </FormField>
                  ))}
                </div>
              )}
              <FormField label={t('products.form.minStock')} htmlFor="product-min-stock" hint={t('products.form.minStockHint')}>
                <input
                  id="product-min-stock"
                  type="number"
                  min={0}
                  placeholder={t('products.placeholders.minStock')}
                  value={form.minimum_stock}
                  onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <ProductImagePendingUpload
                files={pendingImages}
                onChange={setPendingImages}
                disabled={isSubmitting}
                error={imageError}
                onError={setImageError}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetCreateForm();
                }}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? t('common.creating') : t('common.add')}
              </button>
            </div>
          </div>
        </div>
      )}

      <ProductImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => mutate()}
      />
    </div>
  );
}
