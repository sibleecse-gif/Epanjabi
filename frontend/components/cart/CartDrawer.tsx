'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, X } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { formatTaka } from '@/lib/format';
import { useRouter } from 'next/navigation';

export function CartDrawer() {
  const { openCart, setOpenCart, items, totalItems, subtotal } = useCart();
  const router = useRouter();

  if (!openCart) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={() => setOpenCart(false)} />
      <div className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h3 className="text-base font-semibold">কার্ট ({totalItems})</h3>
          <button onClick={() => setOpenCart(false)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">আপনার কার্ট খালি</p>
            <Button
              variant="outline"
              onClick={() => {
                setOpenCart(false);
                router.push('/shop');
              }}
            >
              শপিং শুরু করুন
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="divide-y divide-gray-100">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 py-4">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={64} height={80} className="h-20 w-16 flex-none rounded-lg object-cover" />
                    ) : (
                      <div className="h-20 w-16 flex-none rounded-lg bg-gray-100" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">সাইজ: {item.size}</p>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-brand-600">{formatTaka(item.price * item.qty)}</span>
                        <span className="text-xs text-gray-400">×{item.qty}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border-t border-gray-200 px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-gray-500">সর্বমোট</span>
                <span className="text-base font-bold">{formatTaka(subtotal)}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => { setOpenCart(false); router.push('/cart'); }}>
                  কার্ট দেখুন
                </Button>
                <Button className="flex-1" onClick={() => { setOpenCart(false); router.push('/checkout'); }}>
                  চেকআউট
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}