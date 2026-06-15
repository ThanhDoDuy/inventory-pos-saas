'use client';

import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-inventory';
import { getStockStatusColor } from '@/lib/format';
import { FormField, inputClassName } from '@/components/form-field';
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
  const { products, isLoading, error } = useProducts(searchTerm || undefined);

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('inventory.title')}</h1>
        <p className="text-muted-foreground">{t('inventory.subtitle')}</p>
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
      </div>

      <p className="text-xs text-muted-foreground mt-4">
        {t('inventory.hint.stockChanges')}
      </p>
    </div>
  );
}
