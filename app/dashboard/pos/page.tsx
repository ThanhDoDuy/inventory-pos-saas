'use client';

import { useState } from 'react';
import { POSCart } from '@/components/pos-cart';
import { PosProductPicker } from '@/components/pos-product-picker';
import { PosQuickPaySheet } from '@/components/pos-quick-pay-sheet';
import { useAuthStore } from '@/lib/auth-store';
import { useRetailCartStore } from '@/lib/cart-store';
import { cartItemsToInvoiceItems } from '@/lib/pos-utils';
import { usePosRouteGuard } from '@/hooks/use-pos-route-guard';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function PosRetailPage() {
  const { t } = useTranslation();
  const cart = useRetailCartStore();
  const user = useAuthStore((state) => state.user);
  const [showPay, setShowPay] = useState(false);
  const allowed = usePosRouteGuard(['ADMIN', 'STAFF'], '/dashboard/pos/business');

  const handleCheckout = () => {
    if (cart.items.length === 0) {
      alert(t('pos.alert.emptyCart'));
      return;
    }
    setShowPay(true);
  };

  const handleSuccess = () => {
    cart.clearCart();
    setShowPay(false);
  };

  if (!allowed) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('pos.retail.title')}</h1>
        <p className="text-muted-foreground">{t('pos.retail.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PosProductPicker cart={cart} />
        </div>
        <div>
          <POSCart
            cart={cart}
            variant="retail"
            onCheckout={handleCheckout}
            checkoutLabel={t('pos.retail.confirmPay')}
          />
        </div>
      </div>

      <PosQuickPaySheet
        total={cart.grandTotal}
        items={cartItemsToInvoiceItems(cart.items)}
        isOpen={showPay}
        onClose={() => setShowPay(false)}
        onSuccess={handleSuccess}
        storeName={user?.tenantName}
      />
    </div>
  );
}
