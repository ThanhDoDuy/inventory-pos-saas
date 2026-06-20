'use client';

import { Search, Loader2, AlertTriangle, Download } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-inventory';
import { downloadInventoryBalancesExport } from '@/hooks/use-import-export';
import { getStockStatusColor } from '@/lib/format';
import { FormField, inputClassName } from '@/components/form-field';
import { PaginationBar } from '@/components/pagination-bar';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

function stockStatusColorKey(stock: number, minimumStock = 0) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

export default function InventoryStockPage() {
  const { t } = useTranslation();
  const { formatMoney, getStockStatus } = useFormat();
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const { products, pagination, isLoading, error } = useProducts(
    debouncedSearch || undefined,
    { page },
  );

  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    let totalValue = 0;
    for (const p of products) {
      const min = p.minimum_stock ?? 0;
      if (p.stock <= 0) out++;
      else if (p.stock <= min) low++;
      totalValue += p.stock * p.selling_price;
    }
    return { low, out, totalValue };
  }, [products]);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await downloadInventoryBalancesExport({
        search: searchTerm || undefined,
      });
    } catch (err) {
      alert(err instanceof Error ? err.message : t('importExport.error.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{t('inventory.title')}</h1>
          <p className="text-muted-foreground">{t('inventory.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors disabled:opacity-50"
        >
          {isExporting ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
          {t('importExport.exportBalances')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('inventory.stats.totalValue')}</p>
          <p className="text-2xl font-bold text-foreground">{formatMoney(stats.totalValue)}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('inventory.stats.lowStock')}</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">{t('inventory.stats.outOfStock')}</p>
          <p className="text-2xl font-bold text-red-600">{stats.out}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <FormField label={t('common.search')} htmlFor="stock-search">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-muted-foreground shrink-0" />
            <input
              id="stock-search"
              type="text"
              placeholder={t('inventory.searchPlaceholder')}
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
          <p className="text-center py-12 text-destructive">{t('inventory.error.loadFailed')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.table.product')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('inventory.table.sku')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.table.available')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.table.min')}</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">{t('inventory.table.value')}</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">{t('inventory.table.status')}</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      {t('inventory.empty.noData')}
                    </td>
                  </tr>
                ) : (
                  products.map((item) => {
                    const minStock = item.minimum_stock ?? 0;
                    const statusLabel = getStockStatus(item.stock, minStock);
                    const statusColorKey = stockStatusColorKey(item.stock, minStock);
                    const isLowOrOut = item.stock <= 0 || item.stock <= minStock;
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-secondary/50">
                        <td className="px-6 py-4">
                          <Link
                            href={`/dashboard/products/${item.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {item.name}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.sku}</td>
                        <td className="px-6 py-4 text-right font-semibold">{item.stock}</td>
                        <td className="px-6 py-4 text-right text-muted-foreground">
                          {minStock}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatMoney(item.stock * item.selling_price)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(statusColorKey)}`}
                          >
                            {isLowOrOut && (
                              <AlertTriangle size={12} />
                            )}
                            {statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
        <PaginationBar pagination={pagination} onPageChange={setPage} isLoading={isLoading} />
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {t('inventory.hint.stockChanges')}
      </p>
    </div>
  );
}
