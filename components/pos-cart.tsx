'use client';

import { useCartStore } from '@/lib/cart-store';
import { formatMoney } from '@/lib/format';
import { ShoppingCart, Trash2 } from 'lucide-react';

export function POSCart() {
  const cart = useCartStore();

  return (
    <div className="bg-card rounded-lg border border-border p-6 h-fit sticky top-4">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingCart size={24} className="text-primary" />
        <h2 className="text-xl font-bold text-foreground">Cart</h2>
        {cart.items.length > 0 && (
          <span className="ml-auto bg-primary text-primary-foreground rounded-full px-2 py-1 text-sm font-bold">
            {cart.items.length}
          </span>
        )}
      </div>

      {cart.items.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No items in cart</p>
      ) : (
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
          {cart.items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between gap-2 p-3 bg-secondary rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm truncate">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.quantity} × {formatMoney(item.unitPrice)} = {formatMoney(item.quantity * item.unitPrice)}
                </p>
              </div>
              <button
                onClick={() => cart.removeItem(item.productId)}
                className="p-1 text-destructive hover:bg-destructive/10 rounded flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Tạm tính</span>
          <span className="font-semibold text-foreground">{formatMoney(cart.subtotal)}</span>
        </div>
        {cart.totalDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Giảm giá</span>
            <span>-{formatMoney(cart.totalDiscount)}</span>
          </div>
        )}
        {cart.totalTax > 0 && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thuế</span>
            <span className="font-semibold text-foreground">{formatMoney(cart.totalTax)}</span>
          </div>
        )}
        <div className="border-t border-border pt-2 flex justify-between bg-primary/10 p-2 rounded">
          <span className="font-bold text-foreground">Tổng cộng</span>
          <span className="font-bold text-primary text-lg">{formatMoney(cart.grandTotal)}</span>
        </div>
      </div>

      {/* Discount Controls */}
      <div className="mt-4 pt-4 border-t border-border space-y-3">
        <div>
          <label htmlFor="cart-discount-pct" className="block text-xs font-medium text-foreground mb-1">
            Giảm giá (%)
          </label>
          <input
            id="cart-discount-pct"
            type="number"
            value={cart.discountPercentage}
            onChange={(e) => cart.updateDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 bg-card text-foreground"
          />
        </div>
        <div>
          <label htmlFor="cart-discount-amount" className="block text-xs font-medium text-foreground mb-1">
            Giảm giá cố định (VND)
          </label>
          <input
            id="cart-discount-amount"
            type="number"
            value={cart.customDiscountAmount}
            onChange={(e) => cart.setCustomDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 bg-card text-foreground"
          />
        </div>
        <div>
          <label htmlFor="cart-tax" className="block text-xs font-medium text-foreground mb-1">
            Thuế (%)
          </label>
          <input
            id="cart-tax"
            type="number"
            value={cart.taxPercentage}
            onChange={(e) => cart.updateTaxPercentage(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full px-2 py-1 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 bg-card text-foreground"
          />
        </div>
      </div>

      {/* Notes */}
      <div className="mt-4 pt-4 border-t border-border">
        <label htmlFor="cart-notes" className="block text-xs font-medium text-foreground mb-2">
          Ghi chú đơn hàng
        </label>
        <textarea
          id="cart-notes"
          value={cart.notes}
          onChange={(e) => cart.setNotes(e.target.value)}
          placeholder="Ghi chú cho đơn hàng này..."
          className="w-full px-2 py-2 border border-input rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 bg-card text-foreground resize-none"
          rows={3}
        />
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-4 border-t border-border space-y-2">
        <button
          onClick={() => cart.clearCart()}
          disabled={cart.items.length === 0}
          className="w-full py-2 px-4 border border-destructive text-destructive rounded-lg font-semibold hover:bg-destructive/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Xóa giỏ hàng
        </button>
      </div>
    </div>
  );
}
