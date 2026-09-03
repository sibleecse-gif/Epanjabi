'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, apiErrorMessage } from '@/lib/api';
import { Category, Product } from '@/lib/types';
import { formatTaka } from '@/lib/format';

interface ProductFormValues {
  name: string;
  categoryId: string;
  price: string;
  comparePrice: string;
  description: string;
  sizes: string;
  stock: string;
  isActive: boolean;
  isFeatured: boolean;
  images: string;
}

export function ProductForm({ product, isEdit }: { product?: Product; isEdit?: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: categories } = useQuery<{ categories: Category[] }>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await api.get('/admin/categories')).data.data,
  });

  const [form, setForm] = useState<ProductFormValues>({
    name: product?.name ?? '',
    categoryId: product?.categoryId ?? '',
    price: product ? String(product.price) : '',
    comparePrice: product?.comparePrice ? String(product.comparePrice) : '',
    description: product?.description ?? '',
    sizes: product?.sizes?.join(', ') ?? 'M, L, XL, XXL',
    stock: product ? String(product.stock) : '10',
    isActive: product?.isActive ?? true,
    isFeatured: product?.isFeatured ?? false,
    images: product?.images?.map((i) => i.url).join('\n') ?? '',
  });

  const [saving, setSaving] = useState(false);

  const set = <K extends keyof ProductFormValues>(k: K, v: ProductFormValues[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.categoryId) return toast.error('ক্যাটাগরি নির্বাচন করুন');
    const price = parseInt(form.price, 10);
    if (!price || price <= 0) return toast.error('সঠিক দাম লিখুন');
    const sizes = form.sizes
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      categoryId: form.categoryId,
      price,
      comparePrice: form.comparePrice ? parseInt(form.comparePrice, 10) : null,
      description: form.description,
      sizes,
      stock: parseInt(form.stock, 10) || 0,
      isActive: form.isActive,
      isFeatured: form.isFeatured,
      images: form.images
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };

    setSaving(true);
    try {
      if (isEdit && product) {
        await api.put(`/products/${product.id}`, payload);
        toast.success('পণ্য আপডেট হয়েছে');
      } else {
        await api.post('/products', payload);
        toast.success('পণ্য তৈরি হয়েছে');
      }
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      router.push('/admin/products');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="পণ্যের নাম *" value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="ক্যাজুয়াল চেক শার্ট" />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">ক্যাটাগরি *</label>
          <select
            value={form.categoryId}
            onChange={(e) => set('categoryId', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">ক্যাটাগরি বাছাই করুন</option>
            {(categories?.categories ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <Input label="দাম (টাকা) *" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} required min={1} />
        <Input label="আগের দাম (টাকা)" type="number" value={form.comparePrice} onChange={(e) => set('comparePrice', e.target.value)} min={0} placeholder="ঐচ্ছিক" />
        <Input label="স্টক *" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} min={0} />
        <Input label="সাইজ (কমা দিয়ে আলাদা করুন)" value={form.sizes} onChange={(e) => set('sizes', e.target.value)} placeholder="M, L, XL" />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">বিবরণ *</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={4}
          required
          placeholder="পণ্যের বিস্তারিত বর্ণনা..."
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">ছবির URL (প্রতি লাইনে একটি)</label>
        <textarea
          value={form.images}
          onChange={(e) => set('images', e.target.value)}
          rows={3}
          placeholder={'https://picsum.photos/seed/p1/800/1000\nhttps://picsum.photos/seed/p2/800/1000'}
          className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 font-mono text-xs outline-none focus:border-brand-500"
        />
      </div>

      <div className="flex flex-wrap gap-5">
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4" />
          সক্রিয়
        </label>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4" />
          ফিচার্ড
        </label>
      </div>

      {product && (
        <p className="text-sm text-gray-400">
          SKU: {product.sku} · Slug: {product.slug} · {formatTaka(product.price)}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={saving} size="lg">
          {isEdit ? 'আপডেট করুন' : 'পণ্য তৈরি করুন'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => router.back()}>
          বাতিল
        </Button>
      </div>
    </form>
  );
}