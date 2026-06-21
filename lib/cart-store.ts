import { create } from 'zustand';
import type { StoreApi, UseBoundStore } from 'zustand';
import { RETAIL_TIER_CODE } from '@/lib/price-input';
import { resolvePriceForTier } from '@/lib/pos-utils';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  productPrices?: Record<string, number>;
  priceTierCode: string;
  priceTierLabel: string;
  tax: number;
  discount: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
  orderPriceTierCode: string;
  orderPriceTierLabel: string;
  discountPercentage: number;
  customDiscountAmount: number;
  taxPercentage: number;
  notes: string;

  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;

  addItem: (item: Omit<CartItem, 'total'>) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  setOrderPriceTier: (code: string, label: string) => void;
  updateDiscount: (discountPercentage: number) => void;
  setCustomDiscount: (amount: number) => void;
  updateTaxPercentage: (tax: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
}

export type CartStore = UseBoundStore<StoreApi<CartState>>;

function calculateTotals(
  items: CartItem[],
  discountPercentage: number,
  customDiscountAmount: number,
  taxPercentage: number,
) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const percentageDiscount = (subtotal * discountPercentage) / 100;
  const totalDiscount = percentageDiscount + customDiscountAmount;

  const taxableAmount = subtotal - totalDiscount;
  const totalTax = (taxableAmount * taxPercentage) / 100;

  const grandTotal = taxableAmount + totalTax;

  return {
    items,
    discountPercentage,
    customDiscountAmount,
    taxPercentage,
    subtotal,
    totalDiscount,
    totalTax,
    grandTotal,
  };
}

function createCartStore(): CartStore {
  return create<CartState>((set) => ({
    items: [],
    orderPriceTierCode: RETAIL_TIER_CODE,
    orderPriceTierLabel: '',
    discountPercentage: 0,
    customDiscountAmount: 0,
    taxPercentage: 0,
    notes: '',

    subtotal: 0,
    totalDiscount: 0,
    totalTax: 0,
    grandTotal: 0,

    addItem: (newItem) => {
      set((state) => {
        const existingItem = state.items.find((item) => item.id === newItem.id);

        let updatedItems;
        if (existingItem) {
          updatedItems = state.items.map((item) =>
            item.id === newItem.id
              ? { ...item, quantity: item.quantity + newItem.quantity }
              : item,
          );
        } else {
          updatedItems = [...state.items, newItem as CartItem];
        }

        return calculateTotals(
          updatedItems,
          state.discountPercentage,
          state.customDiscountAmount,
          state.taxPercentage,
        );
      });
    },

    removeItem: (lineId) => {
      set((state) => {
        const updatedItems = state.items.filter((item) => item.id !== lineId);
        return calculateTotals(
          updatedItems,
          state.discountPercentage,
          state.customDiscountAmount,
          state.taxPercentage,
        );
      });
    },

    updateQuantity: (lineId, quantity) => {
      set((state) => {
        if (quantity <= 0) {
          const updatedItems = state.items.filter((item) => item.id !== lineId);
          return calculateTotals(
            updatedItems,
            state.discountPercentage,
            state.customDiscountAmount,
            state.taxPercentage,
          );
        }

        const updatedItems = state.items.map((item) =>
          item.id === lineId ? { ...item, quantity } : item,
        );
        return calculateTotals(
          updatedItems,
          state.discountPercentage,
          state.customDiscountAmount,
          state.taxPercentage,
        );
      });
    },

    setOrderPriceTier: (code, label) => {
      set((state) => {
        if (state.orderPriceTierCode === code && state.orderPriceTierLabel === label) {
          return state;
        }

        const mergedByProduct = new Map<string, CartItem>();

        for (const item of state.items) {
          const unitPrice = resolvePriceForTier(item.productPrices, code, item.unitPrice);
          const existing = mergedByProduct.get(item.productId);

          if (existing) {
            existing.quantity += item.quantity;
          } else {
            mergedByProduct.set(item.productId, {
              ...item,
              id: `${item.productId}:${code}`,
              unitPrice,
              priceTierCode: code,
              priceTierLabel: label,
            });
          }
        }

        const updatedItems = Array.from(mergedByProduct.values());

        return {
          orderPriceTierCode: code,
          orderPriceTierLabel: label,
          ...calculateTotals(
            updatedItems,
            state.discountPercentage,
            state.customDiscountAmount,
            state.taxPercentage,
          ),
        };
      });
    },

    updateDiscount: (discountPercentage) => {
      set((state) =>
        calculateTotals(
          state.items,
          discountPercentage,
          state.customDiscountAmount,
          state.taxPercentage,
        ),
      );
    },

    setCustomDiscount: (amount) => {
      set((state) =>
        calculateTotals(
          state.items,
          state.discountPercentage,
          amount,
          state.taxPercentage,
        ),
      );
    },

    updateTaxPercentage: (taxPercentage) => {
      set((state) =>
        calculateTotals(
          state.items,
          state.discountPercentage,
          state.customDiscountAmount,
          taxPercentage,
        ),
      );
    },

    setNotes: (notes) => {
      set({ notes });
    },

    clearCart: () => {
      set({
        items: [],
        orderPriceTierCode: RETAIL_TIER_CODE,
        orderPriceTierLabel: '',
        discountPercentage: 0,
        customDiscountAmount: 0,
        taxPercentage: 0,
        notes: '',
        subtotal: 0,
        totalDiscount: 0,
        totalTax: 0,
        grandTotal: 0,
      });
    },
  }));
}

export const useRetailCartStore = createCartStore();
export const useBusinessCartStore = createCartStore();
/** @deprecated Use useRetailCartStore or useBusinessCartStore */
export const useCartStore = useRetailCartStore;
