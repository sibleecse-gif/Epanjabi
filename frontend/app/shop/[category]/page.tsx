'use client';

import { Suspense } from 'react';
import { ShopView } from '@/components/product/ShopView';

function CategoryContent({ category }: { category: string }) {
  return <ShopView categorySlug={category} />;
}

export default function CategoryPage({ params }: { params: { category: string } }) {
  return (
    <Suspense fallback={null}>
      <CategoryContent category={params.category} />
    </Suspense>
  );
}