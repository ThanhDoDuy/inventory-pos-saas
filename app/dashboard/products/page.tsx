'use client';

import Link from 'next/link';
import { Package, Plus, Search, Edit2, Trash2, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  createProduct,
  deactivateProduct,
  useCategories,
  useProducts,
} from '@/hooks/use-inventory';
import {
  formatPrice,
  getStockStatus,
  getStockStatusColor,
} from '@/lib/format';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';

export default function InventoryPage() {
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

  const { products, total, isLoading, error, mutate } = useProducts(searchTerm || undefined);
  const { categories } = useCategories();

  const stats = useMemo(() => {
    let lowStock = 0;
    let outOfStock = 0;
    for (const p of products) {
      const status = getStockStatus(p.stock, p.minimum_stock ?? 0);
      if (status === 'Low Stock') lowStock++;
      if (status === 'Out of Stock') outOfStock++;
    }
    return { total: total || products.length, lowStock, outOfStock };
  }, [products, total]);

  const handleCreate = async () => {
    setFormError('');
    if (!form.name || !form.sku || !form.selling_price) {
      setFormError('Vui lòng điền tên, SKU và giá bán');
      return;
    }

    setIsSubmitting(true);
    try {
      await createProduct({
        name: form.name,
        sku: form.sku,
        cost_price: Number(form.cost_price) || 0,
        selling_price: Number(form.selling_price),
        minimum_stock: Number(form.minimum_stock) || 0,
        ...(form.category_id ? { category_id: form.category_id } : {}),
      });
      await mutate();
      setShowAddModal(false);
      setForm({
        name: '',
        sku: '',
        category_id: '',
        cost_price: '',
        selling_price: '',
        minimum_stock: '0',
      });
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Không thể tạo sản phẩm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (productId: string, productName: string) => {
    if (!confirm(`Ngừng bán sản phẩm "${productName}"?`)) return;
    try {
      await deactivateProduct(productId);
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể ngừng bán sản phẩm');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sản phẩm</h1>
          <p className="text-muted-foreground">Quản lý danh mục sản phẩm và giá bán</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Thêm sản phẩm
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Tổng sản phẩm</p>
          <p className="text-3xl font-bold text-foreground">{stats.total}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Sắp hết hàng</p>
          <p className="text-3xl font-bold text-yellow-600">{stats.lowStock}</p>
        </div>
        <div className="bg-card rounded-lg border border-border p-6">
          <p className="text-muted-foreground text-sm mb-2">Hết hàng</p>
          <p className="text-3xl font-bold text-red-600">{stats.outOfStock}</p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 mb-6">
        <FormField label="Tìm kiếm" htmlFor="product-search">
          <div className="flex items-center gap-2">
            <Search size={20} className="text-muted-foreground shrink-0" />
            <input
              id="product-search"
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
          <p className="text-center py-12 text-destructive">Không tải được danh sách sản phẩm</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Sản phẩm</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">SKU</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Danh mục</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Tồn kho</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Tối thiểu</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-foreground">Giá bán</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Trạng thái</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-foreground">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                      Không có sản phẩm
                    </td>
                  </tr>
                ) : (
                  products.map((item) => {
                    const status = getStockStatus(item.stock, item.minimum_stock ?? 0);
                    return (
                      <tr key={item.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Package size={20} className="text-primary" />
                            </div>
                            <span className="font-medium text-foreground">{item.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.sku}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.category?.name ?? '—'}
                        </td>
                        <td className="px-6 py-4 text-right font-semibold text-foreground">{item.stock}</td>
                        <td className="px-6 py-4 text-right text-sm text-muted-foreground">
                          {item.minimum_stock ?? 0}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-foreground">
                          {formatPrice(item.selling_price)}₫
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(status)}`}
                          >
                            {status}
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
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg border border-border p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-foreground mb-6">Thêm sản phẩm</h2>
            {formError && (
              <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
                {formError}
              </div>
            )}
            <div className="space-y-4 mb-6">
              <FormField label="Tên sản phẩm" htmlFor="product-name" required>
                <input
                  id="product-name"
                  type="text"
                  placeholder="Ví dụ: Pepsi"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="SKU" htmlFor="product-sku" required hint="Mã định danh duy nhất trong cửa hàng">
                <input
                  id="product-sku"
                  type="text"
                  placeholder="Ví dụ: PSI"
                  value={form.sku}
                  onChange={(e) => setForm({ ...form, sku: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Danh mục" htmlFor="product-category">
                <select
                  id="product-category"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">— Không chọn —</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Giá vốn (₫)" htmlFor="product-cost">
                <input
                  id="product-cost"
                  type="number"
                  min={0}
                  placeholder="20000"
                  value={form.cost_price}
                  onChange={(e) => setForm({ ...form, cost_price: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Giá bán (₫)" htmlFor="product-price" required>
                <input
                  id="product-price"
                  type="number"
                  min={0}
                  placeholder="30000"
                  value={form.selling_price}
                  onChange={(e) => setForm({ ...form, selling_price: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
              <FormField label="Tồn tối thiểu" htmlFor="product-min-stock" hint="Cảnh báo khi tồn kho ≤ giá trị này">
                <input
                  id="product-min-stock"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={form.minimum_stock}
                  onChange={(e) => setForm({ ...form, minimum_stock: e.target.value })}
                  className={inputClassName}
                />
              </FormField>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 border border-border rounded-lg font-semibold hover:bg-secondary transition-colors text-foreground"
              >
                Hủy
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="flex-1 py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Đang lưu...' : 'Thêm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
