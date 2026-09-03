'use client';

import { Suspense } from 'react';
import { ShopView } from '@/components/product/ShopView';

function ShopContent() {
  return <ShopView />;
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopContent />
    </Suspense>
  );
}