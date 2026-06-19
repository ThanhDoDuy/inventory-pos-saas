import type { ProductItem } from '@/hooks/use-inventory';

export function resolveProductPrices(product: ProductItem): Record<string, number> {
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

export function cartItemsToInvoiceItems(
  items: Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    priceTierCode: string;
  }>,
) {
  return items.map((item) => ({
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceTierCode: item.priceTierCode,
  }));
}
