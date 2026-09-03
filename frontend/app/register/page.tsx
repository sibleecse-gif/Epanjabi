'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { apiErrorMessage } from '@/lib/api';

const schema = z
  .object({
    name: z.string().min(2, 'নাম কমপক্ষে ২ অক্ষরের হতে হবে'),
    email: z.string().email('সঠিক ইমেইল দিন'),
    phone: z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক মোবাইল নম্বর দিন (01XXXXXXXXX)'),
    password: z
      .string()
      .min(8, 'পাসওয়ার্ড কমপক্ষে ৮ অক্ষরের হতে হবে')
      .regex(/[A-Z]/, 'একটি বড় হাতের অক্ষর থাকতে হবে')
      .regex(/[0-9]/, 'একটি সংখ্যা থাকতে হবে'),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: 'পাসওয়ার্ড মিলে না', path: ['confirm'] });

type Form = { name: string; email: string; phone: string; password: string; confirm: string };

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState<Form>({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [loading, setLoading] = useState(false);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const err: Partial<Record<keyof Form, string>> = {};
      for (const issue of parsed.error.issues) (err as Record<string, string>)[issue.path[0]] = issue.message;
      setErrors(err);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success('অ্যাকাউন্ট তৈরি সফল');
      router.push('/');
    } catch (err) {
      toast.error(apiErrorMessage(err, 'রেজিস্ট্রেশন ব্যর্থ'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16">
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">নতুন অ্যাকাউন্ট</h1>
        <p className="mt-1 text-sm text-gray-500">মাত্র কয়েক সেকেন্ডে রেজিস্ট্রেশন সম্পন্ন করুন</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <Input label="সম্পূর্ণ নাম" value={form.name} onChange={set('name')} error={errors.name} placeholder="রাহিম উদ্দিন" />
          <Input label="ইমেইল" type="email" value={form.email} onChange={set('email')} error={errors.email} placeholder="you@example.com" />
          <Input label="মোবাইল নম্বর" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="01XXXXXXXXX" />
          <Input
            label="পাসওয়ার্ড"
            type="password"
            value={form.password}
            onChange={set('password')}
            error={errors.password}
            hint="কমপক্ষে ৮ অক্ষর, একটি বড় হাতের অক্ষর ও একটি সংখ্যা"
            placeholder="••••••••"
          />
          <Input label="পাসওয়ার্ড (আবার)" type="password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            অ্যাকাউন্ট তৈরি করুন
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
          <Link href="/login" className="font-medium text-brand-600 hover:text-brand-700">
            লগইন করুন
          </Link>
        </p>
      </div>
    </div>
  );
}