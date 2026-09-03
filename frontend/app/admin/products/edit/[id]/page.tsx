'use client';

import { useQuery } from '@tanstack/react-query';
import { ProductForm } from '@/components/admin/ProductForm';
import { Spinner } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { Product } from '@/lib/types';

export default function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data, isLoading } = useQuery<{ product: Product }>({
    queryKey: ['admin', 'product', id],
    queryFn: async () => (await api.get(`/admin/products/${id}`)).data.data,
  });

  if (isLoading) return <Spinner className="my-24" />;
  if (!data) {
    return (
      <div className="mt-16 text-center">
        <p className="text-gray-500">পণ্য পাওয়া যায়নি</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">পণ্য সম্পাদনা</h1>
      <p className="mt-1 text-sm text-gray-500">{data.product.name}</p>
      <div className="mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6">
        <ProductForm product={data.product} isEdit />
      </div>
    </div>
  );
}