'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/lib/types';
import { formatTaka } from '@/lib/format';

export function ProductCard({ product }: { product: Product }) {
  const primary = product.images?.find((i) => i.isPrimary) ?? product.images?.[0];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        {primary ? (
          <Image
            src={primary.url}
            alt={primary.alt ?? product.name}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-3xl">👕</div>
        )}
        {product.comparePrice && product.comparePrice > product.price && (
          <span className="absolute left-2 top-2 rounded bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
            {Math.round((1 - product.price / product.comparePrice) * 100)}% ছাড়
          </span>
        )}
        {product.stock === 0 && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
            স্টক নেই
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="truncate text-sm font-medium text-gray-900">{product.name}</p>
        <p className="mt-0.5 text-xs text-gray-500">{product.category?.name ?? ''}</p>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-base font-bold text-brand-600">{formatTaka(product.price)}</span>
          {product.comparePrice && (
            <span className="text-xs text-gray-400 line-through">{formatTaka(product.comparePrice)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}