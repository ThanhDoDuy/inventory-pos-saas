import { create } from 'zustand';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  tax: number;
  discount: number;
  total: number;
}

export interface CartState {
  items: CartItem[];
  discountPercentage: number;
  customDiscountAmount: number;
  taxPercentage: number;
  notes: string;

  // Calculations
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;

  // Actions
  addItem: (item: Omit<CartItem, 'total'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (discountPercentage: number) => void;
  setCustomDiscount: (amount: number) => void;
  updateTaxPercentage: (tax: number) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
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
      const existingItem = state.items.find(
        (item) => item.productId === newItem.productId
      );

      let updatedItems;
      if (existingItem) {
        updatedItems = state.items.map((item) =>
          item.productId === newItem.productId
            ? {
                ...item,
                quantity: item.quantity + newItem.quantity,
              }
            : item
        );
      } else {
        updatedItems = [...state.items, newItem as CartItem];
      }

      return calculateTotals(updatedItems, state.discountPercentage, state.customDiscountAmount, state.taxPercentage);
    });
  },

  removeItem: (productId) => {
    set((state) => {
      const updatedItems = state.items.filter((item) => item.productId !== productId);
      return calculateTotals(updatedItems, state.discountPercentage, state.customDiscountAmount, state.taxPercentage);
    });
  },

  updateQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        const updatedItems = state.items.filter((item) => item.productId !== productId);
        return calculateTotals(updatedItems, state.discountPercentage, state.customDiscountAmount, state.taxPercentage);
      }

      const updatedItems = state.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      );
      return calculateTotals(updatedItems, state.discountPercentage, state.customDiscountAmount, state.taxPercentage);
    });
  },

  updateDiscount: (discountPercentage) => {
    set((state) => {
      return calculateTotals(state.items, discountPercentage, state.customDiscountAmount, state.taxPercentage);
    });
  },

  setCustomDiscount: (amount) => {
    set((state) => {
      return calculateTotals(state.items, state.discountPercentage, amount, state.taxPercentage);
    });
  },

  updateTaxPercentage: (taxPercentage) => {
    set((state) => {
      return calculateTotals(state.items, state.discountPercentage, state.customDiscountAmount, taxPercentage);
    });
  },

  setNotes: (notes) => {
    set({ notes });
  },

  clearCart: () => {
    set({
      items: [],
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

function calculateTotals(
  items: CartItem[],
  discountPercentage: number,
  customDiscountAmount: number,
  taxPercentage: number
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
