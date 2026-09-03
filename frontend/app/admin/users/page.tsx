'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { User } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { formatDate } from '@/lib/format';

interface AdminUser extends User {
  isActive: boolean;
  createdAt: string;
  _count?: { orders: number };
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ users: AdminUser[]; total: number }>({
    queryKey: ['admin', 'users', search],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: '50' });
      if (search) p.set('search', search);
      return (await api.get(`/admin/users?${p.toString()}`)).data.data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await api.patch(`/admin/users/${id}`, { isActive })).data,
    onSuccess: () => {
      toast.success('ব্যবহারকারী স্ট্যাটাস আপডেট হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">ব্যবহারকারী ব্যবস্থাপনা</h1>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="নাম, ইমেইল বা ফোন দিয়ে খুঁজুন..."
        className="mt-4 w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
      />

      {isLoading ? (
        <Spinner className="my-24" />
      ) : (data?.users.length ?? 0) === 0 ? (
        <div className="mt-8">
          <EmptyState title="কোনো ব্যবহারকারী নেই" />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">ব্যবহারকারী</th>
                <th className="px-4 py-3">ফোন</th>
                <th className="px-4 py-3">রোল</th>
                <th className="px-4 py-3">অর্ডার</th>
                <th className="px-4 py-3">যোগ হওয়ার তারিখ</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.users ?? []).map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white">
                        {u.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u.phone}</td>
                  <td className="px-4 py-3">
                    <Badge className={u.role === 'USER' ? 'bg-gray-100 text-gray-600' : 'bg-brand-100 text-brand-700'}>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{u._count?.orders ?? 0}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge className={u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}>
                      {u.isActive ? 'সক্রিয়' : 'ব্লকড'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant={u.isActive ? 'outline' : 'secondary'} onClick={() => toggleMutation.mutate({ id: u.id, isActive: !u.isActive })}>
                      {u.isActive ? 'ব্লক করুন' : 'আনব্লক করুন'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}