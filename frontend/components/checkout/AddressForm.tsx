'use client';

import { useState } from 'react';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { api, apiErrorMessage } from '@/lib/api';
import { Address } from '@/lib/types';

const schema = z.object({
  fullName: z.string().min(2, 'নাম প্রয়োজন'),
  phone: z.string().regex(/^01[3-9]\d{8}$/, 'সঠিক মোবাইল নম্বর দিন'),
  fullAddress: z.string().min(10, 'সম্পূর্ণ ঠিকানা লিখুন'),
  district: z.string().min(2, 'জেলা লিখুন'),
  thana: z.string().min(2, 'থানা লিখুন'),
  postcode: z.string().optional(),
});

const EMPTY = { fullName: '', phone: '', fullAddress: '', district: '', thana: '', postcode: '', isDefault: false };

export function AddressForm({
  onSaved,
  isDefault,
  buttonLabel = 'ঠিকানা সংরক্ষণ করুন',
}: {
  onSaved: (address: Address) => void;
  isDefault?: boolean;
  buttonLabel?: string;
}) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const err: Record<string, string> = {};
      for (const issue of parsed.error.issues) err[issue.path[0]] = issue.message;
      setErrors(err);
      return;
    }
    setErrors({});
    setSaving(true);
    try {
      const res = await api.post<{ data: { address: Address } }>('/users/addresses', {
        ...parsed.data,
        isDefault: isDefault ?? form.isDefault,
      });
      toast.success('ঠিকানা সংরক্ষিত হয়েছে');
      setForm(EMPTY);
      onSaved(res.data.data.address);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="প্রাপকের নাম" value={form.fullName} onChange={set('fullName')} error={errors.fullName} placeholder="রাহিম উদ্দিন" />
        <Input label="মোবাইল নম্বর" value={form.phone} onChange={set('phone')} error={errors.phone} placeholder="01XXXXXXXXX" />
      </div>
      <Input
        label="সম্পূর্ণ ঠিকানা"
        value={form.fullAddress}
        onChange={set('fullAddress')}
        error={errors.fullAddress}
        placeholder="বাসা/রোড, এলাকা, নিকটবর্তী ল্যান্ডমার্ক"
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <Input label="জেলা" value={form.district} onChange={set('district')} error={errors.district} placeholder="ঢাকা" />
        <Input label="থানা" value={form.thana} onChange={set('thana')} error={errors.thana} placeholder="মিরপুর" />
        <Input label="পোস্ট কোড" value={form.postcode} onChange={set('postcode')} placeholder="1216" />
      </div>
      <Button type="submit" loading={saving} className="mt-2 w-full">
        {buttonLabel}
      </Button>
    </form>
  );
}