'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/api';

const schema = z.object({
  email: z.string().email('সঠিক ইমেইল দিন'),
  password: z.string().min(1, 'পাসওয়ার্ড দিন'),
});

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({ email: 'customer@aagdoom.com', password: 'Customer@123' });
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const err: typeof errors = {};
      for (const issue of parsed.error.issues) (err as Record<string, string>)[issue.path[0]] = issue.message;
      setErrors(err);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('লগইন সফল হয়েছে');
      const next = searchParams.get('next');
      router.push(next && next.startsWith('/') ? next : '/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'লগইন ব্যর্থ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">লগইন</h1>
        <p className="mt-1 text-sm text-gray-500">কেনাকাটার জন্য আপনার অ্যাকাউন্টে প্রবেশ করুন</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input
            label="ইমেইল"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={errors.email}
            placeholder="you@example.com"
          />
          <Input
            label="পাসওয়ার্ড"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={errors.password}
            placeholder="••••••••"
          />
          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700">
              পাসওয়ার্ড ভুলে গেছেন?
            </Link>
          </div>
          <Button type="submit" loading={loading} className="w-full" size="lg">
            লগইন করুন
          </Button>
        </form>

        <div className="mt-4 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-700">
          ডেমো অ্যাকাউন্ট: <strong>customer@aagdoom.com</strong> / <strong>Customer@123</strong>
          <br />
          অ্যাডমিন: <strong>admin@aagdoom.com</strong> / <strong>Admin@123</strong>
        </div>

        <p className="mt-6 text-center text-sm text-gray-500">
          অ্যাকাউন্ট নেই?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:text-brand-700">
            রেজিস্ট্রেশন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}