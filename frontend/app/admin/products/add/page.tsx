'use client';

import { ProductForm } from '@/components/admin/ProductForm';

export default function AddProductPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">নতুন পণ্য</h1>
      <p className="mt-1 text-sm text-gray-500">পণ্যের তথ্য পূরণ করে সংরক্ষণ করুন</p>
      <div className="mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6">
        <ProductForm />
      </div>
    </div>
  );
}