'use client';

import Link from 'next/link';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, apiErrorMessage } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="text-4xl">📧</div>
          <h1 className="mt-3 text-xl font-bold">ইমেইল পাঠানো হয়েছে</h1>
          <p className="mt-2 text-sm text-gray-500">
            আপনার ইমেইলে একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। অনুগ্রহ করে ইনবক্স চেক করুন। (Consol এও দেখতে পাবেন)
          </p>
          <Link href="/login" className="mt-5 inline-block text-sm font-medium text-brand-600 hover:text-brand-700">
            লগইন পেজে ফিরুন →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">পাসওয়ার্ড ভুলে গেছেন?</h1>
        <p className="mt-1 text-sm text-gray-500">আপনার রেজিস্ট্রেশন করা ইমেইল দিন</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input label="ইমেইল" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
          <Button type="submit" loading={loading} className="w-full">
            রিসেট লিংক পাঠান
          </Button>
        </form>
      </div>
    </div>
  );
}