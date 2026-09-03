'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { Product } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { formatTaka } from '@/lib/format';

interface AdminProduct extends Product {
  _count?: { orderItems: number };
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');

  const { data, isLoading } = useQuery<{ products: AdminProduct[]; total: number; totalPages: number; page: number }>({
    queryKey: ['admin', 'products', page, q],
    queryFn: async () =>
      (await api.get(`/admin/products?page=${page}&limit=15${q ? `&q=${encodeURIComponent(q)}` : ''}`)).data.data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.put(`/products/${id}`, { isActive })).data,
    onSuccess: () => {
      toast.success('স্ট্যাটাস আপডেট হয়েছে');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/products/${id}`)).data,
    onSuccess: () => {
      toast.success('পণ্য মুছে ফেলা হয়েছে');
      invalidate();
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">পণ্য ব্যবস্থাপনা</h1>
        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="খুঁজুন..."
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
          />
          <Link href="/admin/products/add">
            <Button size="sm">
              <Plus className="h-4 w-4" /> নতুন পণ্য
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <Spinner className="my-24" />
      ) : (data?.products.length ?? 0) === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="কোনো পণ্য নেই"
            description="প্রথম পণ্যটি যোগ করুন"
            action={
              <Link href="/admin/products/add">
                <Button>+ নতুন পণ্য</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">পণ্য</th>
                <th className="px-4 py-3">ক্যাটাগরি</th>
                <th className="px-4 py-3">দাম</th>
                <th className="px-4 py-3">স্টক</th>
                <th className="px-4 py-3">বিক্রি</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.products ?? []).map((p) => {
                const img = p.images?.[0];
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {img ? (
                          <Image src={img.url} alt={p.name} width={40} height={50} className="h-12 w-10 rounded-md object-cover" />
                        ) : (
                          <div className="h-12 w-10 rounded-md bg-gray-100" />
                        )}
                        <span className="line-clamp-1 font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.category?.name}</td>
                    <td className="px-4 py-3 font-semibold">{formatTaka(p.price)}</td>
                    <td className={`px-4 py-3 ${p.stock <= 5 ? 'font-semibold text-rose-600' : ''}`}>{p.stock}</td>
                    <td className="px-4 py-3 text-gray-500">{p._count?.orderItems ?? 0}</td>
                    <td className="px-4 py-3">
                      <Badge className={p.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600'}>
                        {p.isActive ? 'সক্রিয়' : 'নিষ্ক্রিয়'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => toggleMutation.mutate({ id: p.id, isActive: !p.isActive })}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                          title={p.isActive ? 'নিষ্ক্রিয় করুন' : 'সক্রিয় করুন'}
                        >
                          {p.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                        <Link
                          href={`/admin/products/edit/${p.id}`}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-brand-600"
                          title="সম্পাদনা"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`"${p.name}" মুছে ফেলতে চান?`)) deleteMutation.mutate(p.id);
                          }}
                          className="rounded-lg p-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                          title="মুছুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-gray-200 p-3">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← আগে
              </Button>
              <span className="text-sm text-gray-500">পেজ {page} / {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                পরে →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}