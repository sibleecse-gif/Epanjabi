import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CartItem } from '@/lib/types';

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  openCart: boolean;
  setOpenCart: (v: boolean) => void;
  removeItem: (productId: string, size: string) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  clear: () => void;
  subtotal: () => number;
  totalItems: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      openCart: false,
      setOpenCart: (openCart) => set({ openCart }),
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) => i.productId === item.productId && i.size === item.size
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId && i.size === item.size
                  ? { ...i, qty: Math.min(i.qty + item.qty, item.stock) }
                  : i
              ),
            };
          }
          return { items: [...state.items, { ...item, id: `${item.productId}-${item.size}` }] };
        }),
      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter((i) => !(i.productId === productId && i.size === size)),
        })),
      setQty: (productId, size, qty) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId && i.size === size
              ? { ...i, qty: Math.max(1, Math.min(qty, i.stock)) }
              : i
          ),
        })),
      clear: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    { name: 'aagdoom_cart' }
  )
);