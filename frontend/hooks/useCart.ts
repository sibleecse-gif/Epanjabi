'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { useCartStore } from '@/stores/cart-store';
import { api } from '@/lib/api';
import { CartItem, ServerCart, ServerCartItem } from '@/lib/types';

export interface AddCartInput {
  productId: string;
  name: string;
  price: number;
  image?: string;
  size: string;
  qty: number;
  stock: number;
}

function toCartItem(item: ServerCartItem): CartItem {
  return {
    id: item.id,
    userId: '',
    productId: item.product.id,
    name: item.product.name,
    price: item.product.price,
    image: item.product.images?.[0]?.url,
    size: item.size,
    qty: item.qty,
    stock: item.product.stock,
  };
}

export function useCart() {
  const user = useAuthStore((s) => s.user);
  const local = useCartStore();
  const queryClient = useQueryClient();

  const enabled = !!user;

  const serverQuery = useQuery<ServerCart>({
    queryKey: ['cart'],
    queryFn: async () => (await api.get<{ data: ServerCart }>('/cart')).data.data,
    enabled,
    staleTime: 10_000,
  });

  const serverItems: CartItem[] = (serverQuery.data?.items ?? []).map(toCartItem);

  const serverItemId = (productId: string, size: string) =>
    serverQuery.data?.items.find((i) => i.product.id === productId && i.size === size)?.id;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['cart'] });

  const addMutation = useMutation({
    mutationFn: async (input: { productId: string; size: string; qty: number }) =>
      (await api.post('/cart', input)).data,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async (input: { id: string; qty: number }) =>
      (await api.patch(`/cart/${input.id}`, { qty: input.qty })).data,
    onSuccess: invalidate,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/cart/${id}`)).data,
    onSuccess: invalidate,
  });

  const clearMutation = useMutation({
    mutationFn: async () => (await api.delete('/cart')).data,
    onSuccess: invalidate,
  });

  if (enabled) {
    const items = serverItems;
    return {
      isServer: true as const,
      items,
      totalItems: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.price * i.qty, 0),
      isLoading: serverQuery.isLoading,
      addItem: async (input: AddCartInput) => {
        await addMutation.mutateAsync({ productId: input.productId, size: input.size, qty: input.qty });
      },
      removeItem: async (productId: string, size: string) => {
        const id = serverItemId(productId, size);
        if (id) await removeMutation.mutateAsync(id);
      },
      setQty: async (productId: string, size: string, qty: number) => {
        const id = serverItemId(productId, size);
        if (id) await updateMutation.mutateAsync({ id, qty });
      },
      clear: () => clearMutation.mutateAsync(),
      openCart: local.openCart,
      setOpenCart: local.setOpenCart,
    };
  }

  return {
    isServer: false as const,
    items: local.items,
    totalItems: local.totalItems(),
    subtotal: local.subtotal(),
    isLoading: false,
    addItem: async (input: AddCartInput) => {
      local.addItem({
        productId: input.productId,
        name: input.name,
        price: input.price,
        image: input.image,
        size: input.size,
        qty: input.qty,
        stock: input.stock,
      });
    },
    removeItem: async (productId: string, size: string) => local.removeItem(productId, size),
    setQty: async (productId: string, size: string, qty: number) =>
      local.setQty(productId, size, qty),
    clear: async () => local.clear(),
    openCart: local.openCart,
    setOpenCart: local.setOpenCart,
  };
}