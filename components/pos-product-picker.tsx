'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Minus, Search, X, Loader2 } from 'lucide-react';
import { FormField, inputClassName, selectClassName } from '@/components/form-field';
import { useCategories, useProducts, type ProductItem } from '@/hooks/use-inventory';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { usePriceTiers } from '@/hooks/use-price-tiers';
import type { CartState } from '@/lib/cart-store';
import { RETAIL_TIER_CODE } from '@/lib/price-input';
import { resolveUnitPriceForTier } from '@/lib/pos-utils';
import { useFormat, useTranslation } from '@/lib/i18n/use-translation';

interface PosProductPickerProps {
  cart: CartState;
  disabled?: boolean;
}

export function PosProductPicker({ cart, disabled = false }: PosProductPickerProps) {
  const { t } = useTranslation();
  const { formatMoney } = useFormat();
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { categories, isLoading: categoriesLoading } = useCategories();
  const { tiers, isLoading: tiersLoading } = usePriceTiers();

  const activeTiers = useMemo(
    () => tiers.filter((tier) => tier.is_active),
    [tiers],
  );

  useEffect(() => {
    if (!activeTiers.length) {
      return;
    }

    const matched = activeTiers.find((tier) => tier.code === cart.orderPriceTierCode);
    if (matched) {
      if (matched.label !== cart.orderPriceTierLabel) {
        cart.setOrderPriceTier(matched.code, matched.label);
      }
      return;
    }

    const retailTier =
      activeTiers.find((tier) => tier.code === RETAIL_TIER_CODE) ?? activeTiers[0];
    cart.setOrderPriceTier(retailTier.code, retailTier.label);
  }, [activeTiers, cart.orderPriceTierCode, cart.orderPriceTierLabel, cart.setOrderPriceTier]);

  const selectedTier = useMemo(
    () =>
      activeTiers.find((tier) => tier.code === cart.orderPriceTierCode) ??
      activeTiers.find((tier) => tier.code === RETAIL_TIER_CODE) ??
      activeTiers[0],
    [activeTiers, cart.orderPriceTierCode],
  );

  const categoryId = selectedCategoryId !== 'all' ? selectedCategoryId : undefined;
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const { products: categoryProducts, isLoading: productsLoading, error } = useProducts(
    undefined,
    { categoryId, limit: 100 },
  );
  const { products: searchProducts, isLoading: searchLoading } = useProducts(
    debouncedSearch.trim() || undefined,
    { categoryId, limit: 100 },
  );

  const selectedCategoryName = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId)?.name,
    [categories, selectedCategoryId],
  );

  const handleCategoryChange = (nextCategoryId: string) => {
    setSelectedCategoryId(nextCategoryId);
    setSelectedProduct('');
    setSearchTerm('');
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
  };

  const addProductWithOrderTier = (product: ProductItem, qty: number) => {
    if (disabled || !selectedTier) {
      return;
    }

    const stock = product.stock ?? 0;
    if (stock < qty) {
      alert(t('pos.alert.lowStock', { stock }));
      return;
    }

    const unitPrice = resolveUnitPriceForTier(product, selectedTier.code);
    addToCartWithTier(
      product,
      qty,
      selectedTier.code,
      selectedTier.label,
      unitPrice,
    );
  };

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0 || disabled) {
      return;
    }
    const product = categoryProducts.find((item) => item.id === selectedProduct);
    if (!product) {
      return;
    }
    addProductWithOrderTier(product, quantity);
  };

  const handleQuickAdd = (productId: string) => {
    if (disabled) {
      return;
    }
    const product = searchProducts.find((item) => item.id === productId);
    if (!product) {
      return;
    }
    addProductWithOrderTier(product, 1);
  };

  const handleOrderTierChange = (tierCode: string) => {
    const tier = activeTiers.find((item) => item.code === tierCode);
    if (!tier) {
      return;
    }
    cart.setOrderPriceTier(tier.code, tier.label);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border border-primary/30 p-6">
        <FormField label={t('pos.orderPriceTier.label')} htmlFor="pos-order-price-tier">
          {tiersLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2 text-sm">
              <Loader2 className="animate-spin" size={16} />
              {t('common.loading')}
            </div>
          ) : (
            <select
              id="pos-order-price-tier"
              value={cart.orderPriceTierCode}
              onChange={(e) => handleOrderTierChange(e.target.value)}
              className={selectClassName}
              disabled={disabled || activeTiers.length === 0}
            >
              {activeTiers.map((tier) => (
                <option key={tier.code} value={tier.code}>
                  {tier.label}
                </option>
              ))}
            </select>
          )}
        </FormField>
        <p className="text-xs text-muted-foreground mt-2">{t('pos.orderPriceTier.hint')}</p>
      </div>

      <div className="bg-card rounded-lg border border-border p-6">
        <h2 className="text-xl font-bold text-foreground mb-4">{t('pos.addProduct')}</h2>
        {disabled && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            {t('pos.business.customerRequired')}
          </p>
        )}
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
                disabled={disabled}
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
                  disabled={disabled || categoryProducts.length === 0}
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
                      {formatMoney(
                        resolveUnitPriceForTier(product, selectedTier?.code ?? RETAIL_TIER_CODE),
                      )}{' '}
                      ({t('pos.stock', { count: product.stock ?? 0 })})
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
                  className="p-2 border border-input rounded-lg hover:bg-secondary disabled:opacity-50"
                  aria-label={t('pos.decreaseQty')}
                  disabled={disabled}
                >
                  <Minus size={20} />
                </button>
                <input
                  id="pos-quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground text-center"
                  disabled={disabled}
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-2 border border-input rounded-lg hover:bg-secondary disabled:opacity-50"
                  aria-label={t('pos.increaseQty')}
                  disabled={disabled}
                >
                  <Plus size={20} />
                </button>
              </div>
            </FormField>

            <button
              type="button"
              onClick={handleAddProduct}
              disabled={disabled || !selectedProduct || productsLoading || tiersLoading}
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
              disabled={disabled}
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
                disabled={disabled || (product.stock ?? 0) <= 0 || tiersLoading}
                onClick={() => handleQuickAdd(product.id)}
                className="p-3 border border-input rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
              >
                <p className="font-semibold text-foreground text-sm">{product.name}</p>
                {product.category?.name && (
                  <p className="text-xs text-muted-foreground">{product.category.name}</p>
                )}
                <p className="text-primary font-bold">
                  {formatMoney(
                    resolveUnitPriceForTier(product, selectedTier?.code ?? RETAIL_TIER_CODE),
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('pos.stock', { count: product.stock ?? 0 })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
