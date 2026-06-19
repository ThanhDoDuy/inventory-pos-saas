'use client';

import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { Plus, Minus, Search, X, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { POSCart } from '@/components/pos-cart';
import { PaymentModal } from '@/components/payment-modal';
import { PriceTierModal } from '@/components/price-tier-modal';
import { useCategories, useProducts, type ProductItem } from '@/hooks/use-inventory';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePriceTiers } from '@/hooks/use-price-tiers';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

function resolveProductPrices(product: ProductItem): Record<string, number> {
  const retail = product.prices?.RETAIL ?? product.selling_price;
  return {
    WHOLESALE: product.prices?.WHOLESALE ?? retail,
    VIP: product.prices?.VIP ?? retail,
    RETAIL: retail,
    ...Object.fromEntries(
      Object.entries(product.prices ?? {}).filter(
        ([code]) => !['WHOLESALE', 'VIP', 'RETAIL'].includes(code),
      ),
    ),
  };
}

export default function POSPage() {
  const { t } = useTranslation();
  const { formatMoney } = useFormat();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingProduct, setPendingProduct] = useState<{
    product: ProductItem;
    quantity: number;
  } | null>(null);

  const cart = useCartStore();
  const user = useAuthStore((state) => state.user);
  const { categories, isLoading: categoriesLoading } = useCategories();
  const { tiers, isLoading: tiersLoading } = usePriceTiers();

  const categoryId = selectedCategoryId !== 'all' ? selectedCategoryId : undefined;
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const { products: categoryProducts, isLoading: productsLoading, error } = useProducts(
    undefined,
    { categoryId, limit: 100 },
  );
  const {
    products: searchProducts,
    isLoading: searchLoading,
  } = useProducts(debouncedSearch.trim() || undefined, { categoryId, limit: 100 });

  const selectedCategoryName = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId)?.name,
    [categories, selectedCategoryId],
  );

  const handleCategoryChange = (nextCategoryId: string) => {
    setSelectedCategoryId(nextCategoryId);
    setSelectedProduct('');
    setSearchTerm('');
  };

  const openPriceTierPicker = (product: ProductItem, qty: number) => {
    const stock = product.stock ?? 0;
    if (stock < qty) {
      alert(t('pos.alert.lowStock', { stock }));
      return;
    }
    setPendingProduct({ product, quantity: qty });
  };

  const addToCartWithTier = (
    product: ProductItem,
    qty: number,
    tierCode: string,
    tierLabel: string,
    unitPrice: number,
  ) => {
    const lineId = `${product.id}:${tierCode}`;
    const existing = cart.items.find((item) => item.id === lineId);
    const totalQty = (existing?.quantity ?? 0) + qty;
    const stock = product.stock ?? 0;

    if (totalQty > stock) {
      alert(t('pos.alert.lowStock', { stock }));
      return;
    }

    cart.addItem({
      id: lineId,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: qty,
      unitPrice,
      priceTierCode: tierCode,
      priceTierLabel: tierLabel,
      tax: 0,
      discount: 0,
    });

    setSelectedProduct('');
    setQuantity(1);
    setPendingProduct(null);
  };

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) return;
    const product = categoryProducts.find((item) => item.id === selectedProduct);
    if (!product) return;
    openPriceTierPicker(product, quantity);
  };

  const handleQuickAdd = (productId: string) => {
    const product = searchProducts.find((item) => item.id === productId);
    if (!product) return;
    openPriceTierPicker(product, 1);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert(t('pos.alert.emptyCart'));
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    cart.clearCart();
    setShowPayment(false);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('pos.title')}</h1>
        <p className="text-muted-foreground">{t('pos.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">{t('pos.addProduct')}</h2>
            {categoriesLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={20} />
                {t('pos.loadingCategories')}
              </div>
            ) : error ? (
              <p className="text-destructive text-sm">{t('pos.error.loadProducts')}</p>
            ) : (
              <div className="space-y-4">
                <FormField label={t('pos.category')} htmlFor="pos-category">
                  <select
                    id="pos-category"
                    value={selectedCategoryId}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    className={selectClassName}
                  >
                    <option value="all">{t('pos.allCategories')}</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label={t('pos.selectProduct')} htmlFor="pos-product-select">
                  {productsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground py-2 text-sm">
                      <Loader2 className="animate-spin" size={16} />
                      {t('pos.loadingProducts')}
                    </div>
                  ) : (
                    <select
                      id="pos-product-select"
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className={selectClassName}
                      disabled={categoryProducts.length === 0}
                    >
                      <option value="">
                        {categoryProducts.length === 0
                          ? t('pos.noMatchingProducts')
                          : t('pos.selectProductPlaceholder')}
                      </option>
                      {categoryProducts.map((product) => (
                        <option
                          key={product.id}
                          value={product.id}
                          disabled={(product.stock ?? 0) <= 0}
                        >
                          {product.name}
                          {product.category?.name ? ` (${product.category.name})` : ''} —{' '}
                          {formatMoney(product.selling_price)} ({t('pos.stock', { count: product.stock ?? 0 })})
                        </option>
                      ))}
                    </select>
                  )}
                </FormField>

                <FormField label={t('pos.quantity')} htmlFor="pos-quantity">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 border border-input rounded-lg hover:bg-secondary"
                      aria-label={t('pos.decreaseQty')}
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      id="pos-quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 border border-input rounded-lg hover:bg-secondary"
                      aria-label={t('pos.increaseQty')}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </FormField>

                <button
                  type="button"
                  onClick={handleAddProduct}
                  disabled={!selectedProduct || productsLoading || tiersLoading}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {t('pos.addToCart')}
                </button>

                <p className="text-xs text-muted-foreground">
                  {t('pos.productCount', { count: categoryProducts.length })}
                  {selectedCategoryName
                    ? t('pos.productCountInCategory', { name: selectedCategoryName })
                    : ''}
                </p>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">{t('pos.quickSearch')}</h2>
            <FormField label={t('pos.searchProduct')} htmlFor="pos-search">
              <div className="flex items-center gap-2 mb-4">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="pos-search"
                  type="text"
                  placeholder={t('pos.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-2 text-muted-foreground hover:text-foreground"
                    aria-label={t('pos.clearSearch')}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              {!debouncedSearch.trim() ? (
                <p className="col-span-2 text-center text-muted-foreground py-4">
                  {t('pos.searchPlaceholder')}
                </p>
              ) : searchLoading ? (
                <div className="col-span-2 flex items-center justify-center gap-2 text-muted-foreground py-4">
                  <Loader2 className="animate-spin" size={18} />
                  {t('common.loading')}
                </div>
              ) : searchProducts.length === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground py-4">
                  {t('pos.noMatchingProducts')}
                </p>
              ) : (
                searchProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    disabled={(product.stock ?? 0) <= 0 || tiersLoading}
                    onClick={() => handleQuickAdd(product.id)}
                    className="p-3 border border-input rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                  >
                    <p className="font-semibold text-foreground text-sm">{product.name}</p>
                    {product.category?.name && (
                      <p className="text-xs text-muted-foreground">{product.category.name}</p>
                    )}
                    <p className="text-primary font-bold">{formatMoney(product.selling_price)}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('pos.stock', { count: product.stock ?? 0 })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <POSCart />
          <button
            type="button"
            onClick={handleCheckout}
            disabled={cart.items.length === 0}
            className="w-full mt-4 py-3 px-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg sticky bottom-4"
          >
            {t('pos.checkout')}
          </button>
        </div>
      </div>

      {pendingProduct && (
        <PriceTierModal
          isOpen
          productName={pendingProduct.product.name}
          quantity={pendingProduct.quantity}
          tiers={tiers}
          prices={resolveProductPrices(pendingProduct.product)}
          onClose={() => setPendingProduct(null)}
          onSelect={(tier, unitPrice) =>
            addToCartWithTier(
              pendingProduct.product,
              pendingProduct.quantity,
              tier.code,
              tier.label,
              unitPrice,
            )
          }
        />
      )}

      <PaymentModal
        total={cart.grandTotal}
        discount={cart.discountPercentage}
        discountAmount={cart.customDiscountAmount}
        taxPercent={cart.taxPercentage}
        items={cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          priceTierCode: item.priceTierCode,
        }))}
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={handlePaymentSuccess}
        storeName={user?.tenantName}
        notes={cart.notes || undefined}
      />
    </div>
  );
}
