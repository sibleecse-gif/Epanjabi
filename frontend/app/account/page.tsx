'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Trash2, Star } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { AddressForm } from '@/components/checkout/AddressForm';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { api, apiErrorMessage } from '@/lib/api';
import { Address } from '@/lib/types';

function AccountContent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [profile, setProfile] = useState({ name: user?.name ?? '', phone: user?.phone ?? '' });

  const { data, isLoading } = useQuery<{ addresses: Address[] }>({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/users/addresses')).data.data,
  });
  const addresses = data?.addresses ?? [];

  const updateProfileMutation = useMutation({
    mutationFn: async () => (await api.patch('/users/profile', profile)).data,
    onSuccess: () => {
      toast.success('প্রোফাইল আপডেট হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/users/addresses/${id}`)).data,
    onSuccess: () => {
      toast.success('ঠিকানা মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/users/addresses/${id}/default`)).data,
    onSuccess: () => {
      toast.success('ডিফল্ট ঠিকানা সেট হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">আমার অ্যাকাউন্ট</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Profile */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold">প্রোফাইল</h2>
          <div className="mt-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-lg font-bold text-white">
              {user?.name?.charAt(0)}
            </div>
            <div>
              <p className="font-medium">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' ? 'অ্যাডমিন' : 'গ্রাহক'}</p>
            </div>
          </div>
          <div className="mt-4 space-y-3">
            <Input label="নাম" value={profile.name} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} />
            <Input label="মোবাইল" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            <Input label="ইমেইল" value={user?.email ?? ''} disabled />
            <Button
              className="w-full"
              loading={updateProfileMutation.isPending}
              onClick={() => updateProfileMutation.mutate()}
            >
              সংরক্ষণ করুন
            </Button>
          </div>
        </div>

        {/* Addresses */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">ঠিকানাসমূহ</h2>
              <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
                {showForm ? 'বাতিল' : '+ নতুন ঠিকানা'}
              </Button>
            </div>

            {showForm && (
              <div className="mt-4 rounded-xl bg-gray-50 p-4">
                <AddressForm onSaved={() => setShowForm(false)} />
              </div>
            )}

            {isLoading ? (
              <Spinner />
            ) : addresses.length === 0 ? (
              <div className="mt-4">
                <EmptyState title="কোনো ঠিকানা নেই" description="চেকআউটের জন্য একটি ডেলিভারি ঠিকানা যোগ করুন" />
              </div>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {addresses.map((a) => (
                  <div key={a.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{a.fullName}</p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => defaultMutation.mutate(a.id)}
                          className={`rounded-lg p-1.5 transition ${a.isDefault ? 'text-amber-500' : 'text-gray-300 hover:text-amber-500'}`}
                          title="ডিফল্ট করুন"
                        >
                          <Star className="h-4 w-4" fill={a.isDefault ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(a.id)}
                          className="rounded-lg p-1.5 text-gray-300 transition hover:bg-rose-50 hover:text-rose-600"
                          title="মুছুন"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{a.fullAddress}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{a.district}, {a.thana} — {a.phone}</p>
                    {a.isDefault && <Badge className="mt-2 bg-emerald-100 text-emerald-700">ডিফল্ট</Badge>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <RequireAuth>
      <AccountContent />
    </RequireAuth>
  );
}