'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/api';
import { Category, ListingResponse } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { Spinner, EmptyState } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';

const SORTS = [
  { value: 'newest', label: 'নতুন' },
  { value: 'price_asc', label: 'দাম (কম)' },
  { value: 'price_desc', label: 'দাম (বেশি)' },
  { value: 'popular', label: 'জনপ্রিয়' },
];

export function ShopView({ categorySlug }: { categorySlug?: string }) {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const featured = searchParams.get('featured') === 'true';

  const [sort, setSort] = useState('newest');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(categorySlug);
  const [page, setPage] = useState(1);

  const { data: categories } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/products/categories')).data.data,
  });

  const params = useMemo(() => {
    const p = new URLSearchParams({ sort, page: String(page) });
    if (selectedCategory) p.set('category', selectedCategory);
    if (q) p.set('q', q);
    if (featured) p.set('featured', 'true');
    return p.toString();
  }, [sort, selectedCategory, page, q, featured]);

  const { data, isLoading, isError } = useQuery<ListingResponse>({
    queryKey: ['products', 'list', params],
    queryFn: async () => (await api.get(`/products?${params}`)).data.data,
  });

  const activeCategory = categories?.categories.find((c) => c.slug === selectedCategory);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{activeCategory?.name ?? (featured ? 'ফিচার্ড পণ্য' : 'সব পণ্য')}</h1>
        {q && <p className="mt-1 text-sm text-gray-500">“{q}” এর জন্য ফলাফল</p>}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full flex-none lg:w-56">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <SlidersHorizontal className="h-4 w-4" /> ফিল্টার
            </h3>
            <div className="mt-3 space-y-1">
              <Link
                href="/shop"
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  !selectedCategory && !featured ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedCategory(undefined)}
              >
                সব পণ্য
              </Link>
              {categories?.categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c.slug);
                    setPage(1);
                  }}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    selectedCategory === c.slug ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {c.icon} {c.name}
                </button>
              ))}
              <button
                onClick={() => {
                  setSelectedCategory(undefined);
                  setPage(1);
                  window.location.href = '/shop?featured=true';
                }}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                  featured ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                ⭐ ফিচার্ড
              </button>
            </div>
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">মোট {data?.total ?? 0}টি পণ্য</p>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  সাজান: {s.label}
                </option>
              ))}
            </select>
          </div>

          {isLoading ? (
            <Spinner />
          ) : isError ? (
            <EmptyState title="পণ্য লোড করা যায়নি" description="ব্যাকএন্ড সার্ভার চলছে কিনা যাচাই করুন।" />
          ) : (data?.products.length ?? 0) === 0 ? (
            <EmptyState title="কোনো পণ্য পাওয়া যায়নি" description="অন্য ক্যাটাগরি বা কিওয়ার্ড দিয়ে চেষ্টা করুন।" />
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {(data?.products ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {data && data.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← আগে
              </Button>
              <span className="px-2 text-sm text-gray-500">
                পেজ {page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                পরে →
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}