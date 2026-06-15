'use client';

import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useProducts } from '@/hooks/use-inventory';
import {
  formatPrice,
  getStockStatus,
  getStockStatusColor,
} from '@/lib/format';
import { FormField, inputClassName } from '@/components/form-field';

export default function InventoryStockPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { products, isLoading, error } = useProducts(searchTerm || undefined);

  const stats = useMemo(() => {
    let low = 0;
    let out = 0;
    let totalValue = 0;
    for (const p of products) {
      const status = getStockStatus(p.stock, p.minimum_stock ?? 0);
      if (status === 'Low Stock') low++;
      if (status === 'Out of Stock') out++;
      totalValue += p.stock * p.selling_price;
    }
    return { low, out, totalValue };
  }, [products]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Tồn kho</h1>
        <p className="text-muted-foreground">Theo dõi số lượng và giá trị tồn kho thực tế</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Giá trị tồn kho</p>
          <p className="text-2xl font-bold text-foreground">{formatPrice(stats.totalValue)}₫</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Sắp hết hàng</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.low}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Hết hàng</p>
          <p className="text-2xl font-bold text-red-600">{stats.out}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <FormField label="Tìm kiếm" htmlFor="stock-search">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-muted-foreground shrink-0" />
            <input
              id="stock-search"
              type="text"
              placeholder="Tên hoặc SKU..."
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
            Đang tải...
          </div>
        ) : error ? (
          <p className="text-center py-12 text-destructive">Không tải được dữ liệu tồn kho</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">SKU</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Tồn khả dụng</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Tối thiểu</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Giá trị</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  products.map((item) => {
                    const status = getStockStatus(item.stock, item.minimum_stock ?? 0);
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
                          {item.minimum_stock ?? 0}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {formatPrice(item.stock * item.selling_price)}₫
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(status)}`}
                          >
                            {(status === 'Low Stock' || status === 'Out of Stock') && (
                              <AlertTriangle size={12} />
                            )}
                            {status}
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
        Tồn kho thay đổi qua POS bán hàng và nhận hàng PO — không nhập/xuất thủ công.
      </p>
    </div>
  );
}
