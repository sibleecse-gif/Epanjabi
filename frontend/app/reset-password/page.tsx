'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, apiErrorMessage } from '@/lib/api';

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে');
    if (password !== confirm) return toast.error('পাসওয়ার্ড মিলে না');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('পাসওয়ার্ড রিসেট হয়েছে');
      router.push('/login');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-6 space-y-4">
      <Input label="নতুন পাসওয়ার্ড" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      <Input label="পাসওয়ার্ড (আবার)" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
      <Button type="submit" loading={loading} className="w-full">
        পাসওয়ার্ড রিসেট করুন
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">নতুন পাসওয়ার্ড সেট করুন</h1>
        <Suspense fallback={null}>
          <ResetForm />
        </Suspense>
      </div>
    </div>
  );
}