'use client';

import { ArrowLeft, Edit2, Save, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  deactivateProduct,
  updateProduct,
  useProduct,
} from '@/hooks/use-inventory';
import { usePriceTiers } from '@/hooks/use-price-tiers';
import { getStockStatusColor } from '@/lib/format';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';
import { ProductImageGallery } from '@/components/product-image-gallery';

function stockStatusColorKey(stock: number, minimumStock = 0) {
  if (stock <= 0) return 'Out of Stock';
  if (stock <= minimumStock) return 'Low Stock';
  return 'In Stock';
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const { formatMoney, getStockStatus } = useFormat();
  const router = useRouter();
  const params = useParams();
  const productId = typeof params.id === 'string' ? params.id : (params.id?.[0] ?? '');

  const { product, isLoading, error, mutate } = useProduct(productId);
  const { tiers } = usePriceTiers();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    cost_price: 0,
    selling_price: 0,
    minimum_stock: 0,
  });
  const [tierPrices, setTierPrices] = useState<Record<string, number>>({});

  const startEditing = () => {
    if (!product) return;
    const prices = product.prices ?? {
      RETAIL: product.selling_price,
      WHOLESALE: product.selling_price,
      VIP: product.selling_price,
    };
    setEditData({
      name: product.name,
      cost_price: product.cost_price ?? 0,
      selling_price: product.selling_price,
      minimum_stock: product.minimum_stock ?? 0,
    });
    setTierPrices(prices);
    setIsEditing(true);
  };

  if (!productId) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive mb-4">{t('products.detail.error.invalidId')}</p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="text-primary hover:underline"
        >
          {t('common.backToList')}
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="animate-spin" size={24} />
        {t('products.detail.loading')}
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="text-center py-24">
        <p className="text-destructive mb-4">
          {error ? t('products.detail.error.loadFailed') : t('products.detail.error.notFound')}
        </p>
        <button
          onClick={() => router.push('/dashboard/products')}
          className="text-primary hover:underline"
        >
          {t('common.backToList')}
        </button>
      </div>
    );
  }

  const minStock = product.minimum_stock ?? 0;
  const statusLabel = getStockStatus(product.stock, minStock);
  const statusColorKey = stockStatusColorKey(product.stock, minStock);
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
        prices: tierPrices,
        minimum_stock: editData.minimum_stock,
      });
      await mutate();
      setIsEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : t('products.detail.error.updateFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm(t('products.detail.confirm.deactivate', { name: product.name }))) return;
    try {
      await deactivateProduct(productId);
      router.push('/dashboard/products');
    } catch (err) {
      alert(err instanceof Error ? err.message : t('products.detail.error.deactivateFailed'));
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
          <p className="text-muted-foreground">{t('products.detail.sku')}: {product.sku}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">{t('products.detail.productInfo')}</h2>
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 px-4 py-2 border border-primary text-primary rounded-lg font-semibold hover:bg-primary/10 transition-colors"
                >
                  <Edit2 size={20} />
                  {t('common.edit')}
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
                    {t('common.cancel')}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save size={20} />
                    {isSaving ? t('common.saving') : t('common.save')}
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">{t('products.detail.category')}</p>
                  <p className="font-semibold text-foreground">{product.category?.name ?? t('common.none')}</p>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">{t('products.detail.status')}</p>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStockStatusColor(statusColorKey)}`}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">{t('products.detail.productStatus')}</p>
                  <p className="font-semibold text-foreground">{product.status}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-product-name" className="block text-sm font-medium text-foreground mb-2">{t('products.detail.form.name')}</label>
                  <input
                    id="edit-product-name"
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label htmlFor="edit-product-sku" className="block text-sm font-medium text-foreground mb-2">{t('products.detail.form.sku')}</label>
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

          <ProductImageGallery productId={productId} />

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('products.detail.pricing')}</h2>
            {!isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-muted-foreground text-sm mb-1">{t('products.detail.costPrice')}</p>
                    <p className="font-bold text-foreground text-lg">{formatMoney(product.cost_price ?? 0)}</p>
                  </div>
                  <div className="p-4 border border-border rounded-lg">
                    <p className="text-muted-foreground text-sm mb-1">{t('products.detail.sellingPrice')}</p>
                    <p className="font-bold text-foreground text-lg">{formatMoney(product.selling_price)}</p>
                  </div>
                  <div className="p-4 bg-green-100 border border-green-200 rounded-lg">
                    <p className="text-green-800 text-sm mb-1">{t('products.detail.profitMargin')}</p>
                    <p className="font-bold text-green-800 text-lg">{profitMargin}%</p>
                  </div>
                </div>
                {tiers.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tiers.map((tier) => (
                      <div key={tier.code} className="p-3 border border-border rounded-lg">
                        <p className="text-muted-foreground text-sm mb-1">{tier.label}</p>
                        <p className="font-semibold text-foreground">
                          {formatMoney(product.prices?.[tier.code] ?? product.selling_price)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="edit-cost-price" className="block text-sm font-medium text-foreground mb-2">{t('products.detail.form.costPrice')}</label>
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
                    <label htmlFor="edit-selling-price" className="block text-sm font-medium text-foreground mb-2">{t('products.detail.form.sellingPrice')}</label>
                    <input
                      id="edit-selling-price"
                      type="number"
                      value={editData.selling_price}
                      onChange={(e) => {
                        const value = parseFloat(e.target.value) || 0;
                        setEditData({ ...editData, selling_price: value });
                        setTierPrices((prev) => ({ ...prev, RETAIL: value }));
                      }}
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                    />
                  </div>
                </div>
                {tiers.map((tier) => (
                  <div key={tier.code}>
                    <label htmlFor={`edit-tier-${tier.code}`} className="block text-sm font-medium text-foreground mb-2">
                      {tier.label}
                    </label>
                    <input
                      id={`edit-tier-${tier.code}`}
                      type="number"
                      value={tierPrices[tier.code] ?? editData.selling_price}
                      onChange={(e) =>
                        setTierPrices((prev) => ({
                          ...prev,
                          [tier.code]: parseFloat(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('products.detail.inventory')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-border rounded-lg">
                <p className="text-muted-foreground text-sm mb-1">{t('products.detail.currentStock')}</p>
                <p className="font-bold text-foreground text-2xl">{product.stock}</p>
              </div>
              <div className="p-4 border border-border rounded-lg">
                <p className="text-muted-foreground text-sm mb-1">{t('products.detail.stockValue')}</p>
                <p className="font-bold text-foreground text-2xl">{formatMoney(totalValue)}</p>
              </div>
              {!isEditing ? (
                <div className="p-4 border border-border rounded-lg">
                  <p className="text-muted-foreground text-sm mb-1">{t('products.detail.minStock')}</p>
                  <p className="font-bold text-foreground text-lg">{minStock}</p>
                </div>
              ) : (
                <div>
                  <label htmlFor="edit-min-stock" className="block text-sm font-medium text-foreground mb-2">{t('products.detail.form.minStock')}</label>
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
              {t('products.detail.hint.stockAdjustment')}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('products.detail.stockStatus')}</h2>
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-sm mb-2">{t('products.detail.stockLevel')}</p>
                <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min(100, minStock ? (product.stock / Math.max(minStock * 2, 1)) * 100 : 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('products.detail.unitsWithMin', { stock: product.stock, min: minStock })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-6">{t('products.detail.actions')}</h2>
            <button
              onClick={handleDeactivate}
              className="w-full py-2 px-4 border border-destructive text-destructive rounded-lg font-semibold hover:bg-destructive/10 transition-colors"
            >
              {t('products.detail.deactivate')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
