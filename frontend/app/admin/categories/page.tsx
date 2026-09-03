'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { Category } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/misc';
import { Input } from '@/components/ui/Input';

interface AdminCategory extends Category {
  _count?: { products: number };
}

export default function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('');

  const { data, isLoading } = useQuery<{ categories: AdminCategory[] }>({
    queryKey: ['admin', 'categories'],
    queryFn: async () => (await api.get('/admin/categories')).data.data,
  });

  const createMutation = useMutation({
    mutationFn: async () => (await api.post('/admin/categories', { name, description, icon })).data,
    onSuccess: () => {
      toast.success('ক্যাটাগরি তৈরি হয়েছে');
      setName('');
      setDescription('');
      setIcon('');
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">ক্যাটাগরি ব্যবস্থাপনা</h1>

      <div className="mt-6 max-w-xl rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold">নতুন ক্যাটাগরি</h2>
        <div className="mt-4 space-y-3">
          <Input label="নাম *" value={name} onChange={(e) => setName(e.target.value)} placeholder="শার্ট" />
          <Input label="আইকন (ইমোজি)" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="👔" />
          <Input label="বিবরণ" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ক্যাজুয়াল ও ফরমাল শার্ট" />
          <Button onClick={() => createMutation.mutate()} loading={createMutation.isPending} disabled={!name.trim()}>
            ক্যাটাগরি তৈরি করুন
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Spinner className="my-16" />
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(data?.categories ?? []).map((c) => (
            <div key={c.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-2xl">{c.icon ?? '🧵'}</span>
              <div className="min-w-0">
                <p className="font-medium">{c.name}</p>
                <p className="truncate text-xs text-gray-400">{c._count?.products ?? 0} পণ্য · {c.slug}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}