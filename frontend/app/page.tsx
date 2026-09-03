'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { Package, Truck, ShieldCheck, BadgePercent } from 'lucide-react';
import { api } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { ProductCard } from '@/components/product/ProductCard';
import { Spinner } from '@/components/ui/misc';

const HERO_IMAGE = 'https://picsum.photos/seed/aagdoom-hero/1600/900';

export default function HomePage() {
  const { data: categories, isLoading: loadingCat } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/products/categories')).data.data,
  });

  const { data: featured, isLoading: loadingFeatured } = useQuery<{ products: Product[] }>({
    queryKey: ['products', 'featured'],
    queryFn: async () => (await api.get('/products/featured')).data.data,
  });

  const { data: latest, isLoading: loadingLatest } = useQuery<{ products: Product[] }>({
    queryKey: ['products', 'latest'],
    queryFn: async () => (await api.get('/products?sort=newest&limit=8')).data.data,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-900">
        <Image src={HERO_IMAGE} alt="" fill className="object-cover opacity-40" priority />
        <div className="relative mx-auto flex max-w-7xl flex-col items-start justify-center px-4 py-24 sm:px-6 lg:py-32">
          <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-brand-300 backdrop-blur">
            ঈদ কালেকশন ২০২৬
          </span>
          <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-tight text-white sm:text-5xl">
            নতুন শৈলীতে <span className="text-brand-400">আগদুম</span> ফ্যাশন
          </h1>
          <p className="mt-4 max-w-lg text-lg text-gray-200">
            প্রিমিয়াম কাপড়, আধুনিক ডিজাইন, সাশ্রয়ী মূল্য। সারা বাংলাদেশে দ্রুত ডেলিভারি।
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
            >
              এখনই কিনুন
            </Link>
            <Link
              href="/shop?featured=true"
              className="rounded-lg border border-white/30 px-6 py-3 text-sm font-semibold text-white backdrop-blur hover:bg-white/10"
            >
              ফিচার্ড কালেকশন
            </Link>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        {[
          { icon: Truck, title: 'দ্রুত ডেলিভারি', sub: '৩-৫ কর্মদিবসে সারা দেশে' },
          { icon: ShieldCheck, title: 'নিরাপদ পেমেন্ট', sub: 'bKash, Nagad ও কার্ড' },
          { icon: BadgePercent, title: 'সেরা দাম', sub: 'নিয়মিত অফার ও ছাড়' },
          { icon: Package, title: 'সহজ রিটার্ন', sub: '৭ দিনের রিটার্ন নীতি' },
        ].map((b) => (
          <div key={b.title} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <b.icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold">{b.title}</p>
              <p className="text-xs text-gray-500">{b.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">ক্যাটাগরি</h2>
        </div>
        {loadingCat ? (
          <Spinner />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {(categories?.categories ?? []).map((c) => (
              <Link
                key={c.id}
                href={`/shop?category=${c.slug}`}
                className="group flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center transition hover:border-brand-400 hover:shadow-md"
              >
                <span className="text-3xl">{c.icon ?? '🧵'}</span>
                <span className="mt-2 text-sm font-medium text-gray-900 group-hover:text-brand-600">{c.name}</span>
                {c._count && <span className="mt-0.5 text-xs text-gray-400">{c._count.products} পণ্য</span>}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Featured */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">ফিচার্ড পণ্য</h2>
          <Link href="/shop?featured=true" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            সব দেখুন →
          </Link>
        </div>
        {loadingFeatured ? (
          <Spinner />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(featured?.products ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Latest */}
      <section className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">সাম্প্রতিক পণ্য</h2>
          <Link href="/shop" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            সব দেখুন →
          </Link>
        </div>
        {loadingLatest ? (
          <Spinner />
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {(latest?.products ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Offer strip */}
      <section className="mx-auto mt-14 max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-700 px-8 py-10 text-white sm:flex-row">
          <div>
            <h3 className="text-2xl font-bold">আজকের অফার</h3>
            <p className="mt-1 text-sm text-brand-100">ব্যবহার করুন কোড <strong>AAGDOOM10</strong> — ১০% ছাড়।</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold">৳1859</p>
            <p className="text-sm text-brand-100">থেকে মাত্র</p>
          </div>
        </div>
      </section>

      {/* Footer note strip already in layout */}
    </div>
  );
}