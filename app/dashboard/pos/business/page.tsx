'use client';

import { useState } from 'react';
import { POSCart } from '@/components/pos-cart';
import { PosCustomerPanel } from '@/components/pos-customer-panel';
import { PosProductPicker } from '@/components/pos-product-picker';
import { PaymentModal } from '@/components/payment-modal';
import { useAuthStore } from '@/lib/auth-store';
import { useBusinessCartStore } from '@/lib/cart-store';
import { cartItemsToInvoiceItems } from '@/lib/pos-utils';
import type { CustomerItem } from '@/hooks/use-customers';
import { useTenant } from '@/hooks/use-tenant';
import { PERMISSIONS } from '@/lib/permission-codes';
import { usePermissionRouteGuard } from '@/hooks/use-permission-route-guard';
import { useTranslation } from '@/lib/i18n/use-translation';

export default function PosBusinessPage() {
  const { t } = useTranslation();
  const cart = useBusinessCartStore();
  const user = useAuthStore((state) => state.user);
  const { tenant } = useTenant();
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerItem | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const allowed = usePermissionRouteGuard(
    [PERMISSIONS.INVOICE_CREATE, PERMISSIONS.CUSTOMERS_VIEW],
    '/dashboard/pos',
  );

  const handleCheckout = () => {
    if (!selectedCustomer) {
      alert(t('pos.business.customerRequired'));
      return;
    }
    if (cart.items.length === 0) {
      alert(t('pos.alert.emptyCart'));
      return;
    }
    setShowPayment(true);
  };

  const handlePaymentSuccess = () => {
    cart.clearCart();
    setSelectedCustomer(null);
    setShowPayment(false);
  };

  const storeAddress = [tenant?.address, tenant?.city, tenant?.state]
    .filter(Boolean)
    .join(', ');

  if (!allowed) {
    return null;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">{t('pos.business.title')}</h1>
        <p className="text-muted-foreground">{t('pos.business.subtitle')}</p>
      </div>

      <PosCustomerPanel
        selectedCustomer={selectedCustomer}
        onSelectCustomer={setSelectedCustomer}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PosProductPicker cart={cart} disabled={!selectedCustomer} />
        </div>
        <div>
          <POSCart
            cart={cart}
            variant="business"
            onCheckout={handleCheckout}
            disabled={!selectedCustomer}
          />
        </div>
      </div>

      {selectedCustomer && (
        <PaymentModal
          total={cart.grandTotal}
          discount={cart.discountPercentage}
          discountAmount={cart.customDiscountAmount}
          taxPercent={cart.taxPercentage}
          items={cartItemsToInvoiceItems(cart.items)}
          customerId={selectedCustomer.id}
          customer={selectedCustomer}
          isOpen={showPayment}
          onClose={() => setShowPayment(false)}
          onSuccess={handlePaymentSuccess}
          storeName={user?.tenantName ?? tenant?.name}
          storeAddress={storeAddress || undefined}
          storePhone={tenant?.phone || undefined}
          notes={cart.notes || undefined}
        />
      )}
    </div>
  );
}
