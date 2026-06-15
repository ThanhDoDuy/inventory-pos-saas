'use client';

import { useCartStore } from '@/lib/cart-store';
import { useAuthStore } from '@/lib/auth-store';
import { Plus, Minus, Search, X, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { POSCart } from '@/components/pos-cart';
import { PaymentModal } from '@/components/payment-modal';
import { useProducts } from '@/hooks/use-inventory';
import { FormField, inputClassName } from '@/components/form-field';
import { formatMoney } from '@/lib/format';

export default function POSPage() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showPayment, setShowPayment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const cart = useCartStore();
  const user = useAuthStore((state) => state.user);
  const { products, isLoading, error } = useProducts(searchTerm || undefined);

  const handleAddProduct = () => {
    if (!selectedProduct || quantity <= 0) return;

    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;

    if (product.stock < quantity) {
      alert(`Chỉ còn ${product.stock} sản phẩm trong kho`);
      return;
    }

    cart.addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity,
      unitPrice: product.selling_price,
      tax: 0,
      discount: 0,
    });

    setSelectedProduct('');
    setQuantity(1);
  };

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert('Giỏ hàng trống');
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    cart.clearCart();
    setShowPayment(false);
  };

  const invoiceTotal =
    cart.subtotal - (cart.subtotal * cart.discountPercentage) / 100;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Point of Sale</h1>
        <p className="text-muted-foreground">Tạo và xử lý giao dịch bán hàng</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Thêm sản phẩm</h2>
            {isLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground py-4">
                <Loader2 className="animate-spin" size={20} />
                Đang tải sản phẩm...
              </div>
            ) : error ? (
              <p className="text-destructive text-sm">Không tải được danh sách sản phẩm</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor="pos-product-select" className="block text-sm font-medium text-foreground mb-2">
                    Chọn sản phẩm
                  </label>
                  <select
                    id="pos-product-select"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground"
                  >
                    <option value="">Chọn sản phẩm...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                        {p.name} — {formatMoney(p.selling_price)} (Kho: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pos-quantity" className="block text-sm font-medium text-foreground mb-2">
                    Số lượng
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2 border border-input rounded-lg hover:bg-secondary"
                      aria-label="Giảm số lượng"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      id="pos-quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="flex-1 px-4 py-2 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 bg-card text-foreground text-center"
                    />
                    <button
                      type="button"
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-2 border border-input rounded-lg hover:bg-secondary"
                      aria-label="Tăng số lượng"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAddProduct}
                  disabled={!selectedProduct}
                  className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  Thêm vào giỏ
                </button>
              </div>
            )}
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">Tìm kiếm nhanh</h2>
            <FormField label="Tìm sản phẩm" htmlFor="pos-search">
              <div className="flex items-center gap-2 mb-4">
                <Search size={20} className="text-muted-foreground shrink-0" />
                <input
                  id="pos-search"
                  type="text"
                  placeholder="Tên hoặc SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`${inputClassName} flex-1`}
                />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-2 text-muted-foreground hover:text-foreground"
                >
                  <X size={20} />
                </button>
              )}
              </div>
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              {products.length === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground py-4">
                  Không có sản phẩm
                </p>
              ) : (
                products.map((p) => (
                  <button
                    key={p.id}
                    disabled={p.stock <= 0}
                    onClick={() => {
                      const existing = cart.items.find((i) => i.productId === p.id);
                      if (existing) {
                        if (existing.quantity >= p.stock) {
                          alert(`Chỉ còn ${p.stock} sản phẩm trong kho`);
                          return;
                        }
                        cart.updateQuantity(p.id, existing.quantity + 1);
                      } else {
                        cart.addItem({
                          id: p.id,
                          productId: p.id,
                          name: p.name,
                          sku: p.sku,
                          quantity: 1,
                          unitPrice: p.selling_price,
                          tax: 0,
                          discount: 0,
                        });
                      }
                    }}
                    className="p-3 border border-input rounded-lg hover:bg-secondary transition-colors text-left disabled:opacity-50"
                  >
                    <p className="font-semibold text-foreground text-sm">{p.name}</p>
                    <p className="text-primary font-bold">{formatMoney(p.selling_price)}</p>
                    <p className="text-xs text-muted-foreground">Kho: {p.stock}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <POSCart />
          <button
            onClick={handleCheckout}
            disabled={cart.items.length === 0}
            className="w-full mt-4 py-3 px-4 bg-primary text-primary-foreground rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg sticky bottom-4"
          >
            Thanh toán
          </button>
        </div>
      </div>

      <PaymentModal
        total={invoiceTotal}
        discount={cart.discountPercentage}
        items={cart.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
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
