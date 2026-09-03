'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { EmptyState, Spinner } from '@/components/ui/misc';
import { formatTaka } from '@/lib/format';

const DELIVERY_FEE = 60;

export default function CartPage() {
  const { items, totalItems, subtotal, setQty, removeItem, isLoading } = useCart();
  const router = useRouter();

  if (isLoading) return <Spinner className="my-24 mx-auto" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <EmptyState
          title="আপনার কার্ট খালি"
          description="আপনার পছন্দের পণ্যগুলো কার্টে যোগ করুন"
          action={<Button onClick={() => router.push('/shop')}>শপিং শুরু করুন</Button>}
        />
      </div>
    );
  }

  const grandTotal = subtotal + DELIVERY_FEE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">শপিং কার্ট ({totalItems})</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ul className="divide-y divide-gray-200 rounded-2xl border border-gray-200 bg-white">
            {items.map((item) => (
              <li key={item.id} className="flex gap-4 p-4">
                {item.image ? (
                  <div className="relative block h-28 w-20 flex-none">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={112}
                      className="h-28 w-20 rounded-lg object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-28 w-20 flex-none rounded-lg bg-gray-100" />
                )}
                <div className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="mt-0.5 text-xs text-gray-500">সাইজ: {item.size}</p>
                      <p className="mt-1 text-sm font-semibold text-brand-600">{formatTaka(item.price)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.size)}
                      className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-gray-300">
                      <button
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                        disabled={item.qty <= 1}
                        onClick={() => setQty(item.productId, item.size, item.qty - 1)}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.qty}</span>
                      <button
                        className="px-3 py-1.5 text-gray-500 hover:text-gray-900 disabled:opacity-40"
                        disabled={item.qty >= item.stock}
                        onClick={() => setQty(item.productId, item.size, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-sm text-gray-500">{formatTaka(item.price * item.qty)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold">সারাংশ</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-500">সাবটোটাল</dt>
              <dd>{formatTaka(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">ডেলিভারি চার্জ</dt>
              <dd>{formatTaka(DELIVERY_FEE)}</dd>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-3 text-base font-bold">
              <dt>সর্বমোট</dt>
              <dd className="text-brand-600">{formatTaka(grandTotal)}</dd>
            </div>
          </dl>
          <Link href="/checkout">
            <Button size="lg" className="mt-5 w-full">
              চেকআউটে যান
            </Button>
          </Link>
          <Link href="/shop" className="mt-3 block text-center text-sm font-medium text-brand-600 hover:text-brand-700">
            আরও কেনাকাটা করুন
          </Link>
        </div>
      </div>
    </div>
  );
}