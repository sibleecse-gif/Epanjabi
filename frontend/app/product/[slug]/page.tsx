'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Truck, RotateCcw, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';
import { Spinner } from '@/components/ui/misc';
import { ProductCard } from '@/components/product/ProductCard';
import { AddToCartButton } from '@/components/product/ProductActions';
import { formatTaka } from '@/lib/format';

export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { data, isLoading, isError } = useQuery<{ product: Product }>({
    queryKey: ['product', params.slug],
    queryFn: async () => (await api.get(`/products/${params.slug}`)).data.data,
  });

  const [selectedImage, setSelectedImage] = useState(0);

  if (isLoading) return <Spinner className="mx-auto my-24" />;
  if (isError || !data) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-xl font-bold">পণ্যটি পাওয়া যায়নি</h1>
        <Link href="/shop" className="mt-4 inline-block text-brand-600">সব পণ্য দেখুন →</Link>
      </div>
    );
  }

  const product = data.product;
  const images = product.images?.length ? product.images : [];
  const active = images[selectedImage] ?? images[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="mb-6 flex items-center gap-1 text-sm text-gray-500">
        <Link href="/" className="hover:text-brand-600">হোম</Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/shop?category=${product.category.slug}`} className="hover:text-brand-600">
          {product.category.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-gray-900">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gallery */}
        <div>
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl border border-gray-200 bg-white">
            {active ? (
              <Image src={active.url} alt={active.alt ?? product.name} fill className="object-cover" sizes="50vw" priority />
            ) : (
              <div className="flex h-full items-center justify-center text-6xl">👕</div>
            )}
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="absolute left-3 top-3 rounded-lg bg-brand-600 px-3 py-1 text-sm font-semibold text-white">
                {Math.round((1 - product.price / product.comparePrice) * 100)}% ছাড়
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`relative aspect-square w-20 overflow-hidden rounded-lg border-2 transition ${
                    selectedImage === i ? 'border-brand-600' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image src={img.url} alt={img.alt ?? product.name} fill className="object-cover" sizes="80px" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-500">
            <Link href={`/shop?category=${product.category.slug}`} className="hover:text-brand-600">
              {product.category.name}
            </Link>
            <span className="mx-2">·</span>
            SKU: {product.sku}
          </p>
          <h1 className="mt-2 text-3xl font-bold">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold text-brand-600">{formatTaka(product.price)}</span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-lg text-gray-400 line-through">{formatTaka(product.comparePrice)}</span>
            )}
          </div>

          <div className="mt-6">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                price: product.price,
                sizes: product.sizes,
                stock: product.stock,
                image: images[0]?.url,
              }}
            />
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: 'দ্রুত ডেলিভারি', sub: 'সারা বাংলাদেশ' },
              { icon: RotateCcw, label: 'সহজ রিটার্ন', sub: '৭ দিন' },
              { icon: ShieldCheck, label: 'গোপনীয়তা', sub: 'নিরাপদ লেনদেন' },
            ].map((b) => (
              <div key={b.label} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
                <b.icon className="mx-auto h-5 w-5 text-brand-600" />
                <p className="mt-1.5 text-xs font-semibold">{b.label}</p>
                <p className="text-[11px] text-gray-500">{b.sub}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-base font-semibold">বিবরণ</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-gray-600">{product.description}</p>
            {product.sizes.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold">উপলব্ধ সাইজ</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <span key={s} className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-600">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {product.related && product.related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold">সম্পর্কিত পণ্য</h2>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {product.related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}