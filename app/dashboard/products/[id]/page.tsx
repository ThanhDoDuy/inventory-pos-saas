'use client';

import { ArrowLeft, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  deactivateProduct,
  updateProduct,
  useProduct,
} from '@/hooks/use-inventory';
import {
  formatPrice,
  getStockStatus,
  getStockStatusColor,
} from '@/lib/format';

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const productId = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  const { product, isLoading, error, mutate } = useProduct(productId);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    cost_price: 0,
    selling_price: 0,
    minimum_stock: 0,
  });

  const startEditing = () => {
    if (!product) return;
    setEditData({
      name: product.name,
      cost_price: product.cost_price ?? 0,
      selling_price: product.selling_price,
      minimum_stock: product.minimum_stock ?? 0,
    });
    setIsEditing(true);
  };

  if (!productId) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive mb-4">ID sản phẩm không hợp lệ</p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="text-primary hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="animate-spin" size={24} />
        Đang tải sản phẩm...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive mb-4">
          {error ? 'Không tải được sản phẩm' : 'Không tìm thấy sản phẩm'}
        </p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="text-primary hover:underline"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const status = getStockStatus(product.stock, product.minimum_stock ?? 0);
  const profit = product.selling_price - (product.cost_price ?? 0);
  const profitMargin =
    product.selling_price > 0 ? ((profit / product.selling_price) * 100).toFixed(1) : '0';
  const totalValue = product.stock * product.selling_price;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProduct(productId, {
        name: editData.name,
        cost_price: editData.cost_price,
        selling_price: editData.selling_price,
        minimum_stock: editData.minimum_stock,
      });
      await mutate();
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể cập nhật sản phẩm');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(`Ngừng bán sản phẩm "${product.name}"?`)) return;
    try {
      await deactivateProduct(productId);
      router.push('/dashboard/products');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Không thể ngừng bán sản phẩm');
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-center gap-4">
        <button
          onClick={() => router.push('/dashboard/products')}
          className="p-2 hover:bg-secondary rounded-lg transition-colors"
        >
          <ArrowLeft size={24} className="text-foreground" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">{product.name}</h1>
          <p className="text-muted-foreground">SKU: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Thông tin sản phẩm</h2>
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                >
                  <Edit2 size={20} />
                  Sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditData({
                        name: product.name,
                        cost_price: product.cost_price ?? 0,
                        selling_price: product.selling_price,
                        minimum_stock: product.minimum_stock ?? 0,
                      });
                      setIsEditing(false);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-border text-foreground rounded-lg font-semibold hover:bg-secondary transition-colors"
                  >
                    <X size={20} />
                    Hủy
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save size={20} />
                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Danh mục</p>
                  <p className="font-semibold text-foreground">{product.category?.name ?? '—'}</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Trạng thái</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(status)}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Trạng thái SP</p>
                  <p className="font-semibold text-foreground">{product.status}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-product-name" className="block text-sm font-medium text-foreground mb-2">Tên sản phẩm</label>
                  <input
                    id="edit-product-name"
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-sku" className="block text-sm font-medium text-foreground mb-2">SKU</label>
                  <input
                    id="edit-product-sku"
                    type="text"
                    value={product.sku}
                    disabled
                    className="w-full px-4 py-2 border border-input rounded-lg bg-secondary text-foreground opacity-75"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Giá</h2>
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Giá vốn</p>
                  <p className="font-bold text-foreground text-lg">{formatPrice(product.cost_price ?? 0)}₫</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Giá bán</p>
                  <p className="font-bold text-foreground text-lg">{formatPrice(product.selling_price)}₫</p>
                </div>
                <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                  <p className="text-green-800 text-sm mb-1">Biên lợi nhuận</p>
                  <p className="font-bold text-green-800 text-lg">{profitMargin}%</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-cost-price" className="block text-sm font-medium text-foreground mb-2">Giá vốn (₫)</label>
                  <input
                    id="edit-cost-price"
                    type="number"
                    value={editData.cost_price}
                    onChange={(e) =>
                      setEditData({ ...editData, cost_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="edit-selling-price" className="block text-sm font-medium text-foreground mb-2">Giá bán (₫)</label>
                  <input
                    id="edit-selling-price"
                    type="number"
                    value={editData.selling_price}
                    onChange={(e) =>
                      setEditData({ ...editData, selling_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Tồn kho</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-muted-foreground text-sm mb-1">Tồn hiện tại</p>
                <p className="font-bold text-foreground text-2xl">{product.stock}</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-muted-foreground text-sm mb-1">Giá trị tồn</p>
                <p className="font-bold text-foreground text-2xl">{formatPrice(totalValue)}₫</p>
              </div>
              {!isEditing ? (
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">Tồn tối thiểu</p>
                  <p className="font-bold text-foreground text-lg">{product.minimum_stock ?? 0}</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="edit-min-stock" className="block text-sm font-medium text-foreground mb-2">Tồn tối thiểu</label>
                  <input
                    id="edit-min-stock"
                    type="number"
                    value={editData.minimum_stock}
                    onChange={(e) =>
                      setEditData({ ...editData, minimum_stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Điều chỉnh số lượng tồn qua phiếu nhập kho (PO), không sửa trực tiếp tại đây.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Tình trạng kho</h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm mb-2">Mức tồn</p>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, product.minimum_stock ? (product.stock / Math.max(product.minimum_stock * 2, 1)) * 100 : 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {product.stock} đơn vị (tối thiểu: {product.minimum_stock ?? 0})
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">Thao tác</h2>
            <button
              onClick={handleDeactivate}
              className="w-full py-2 px-4 border border-destructive text-destructive rounded-lg font-semibold hover:bg-destructive/10 transition-colors"
            >
              Ngừng bán sản phẩm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
