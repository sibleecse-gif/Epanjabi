'use client';

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/misc';
import { formatTaka } from '@/lib/format';
import { Order } from '@/lib/types';

function MockGateway() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') ?? '';
  const txid = searchParams.get('txid') ?? '';
  const [processing, setProcessing] = useState(false);

  const { data, isLoading } = useQuery<{ order: Order }>({
    queryKey: ['order', orderId],
    queryFn: async () => (await api.get(`/orders/${orderId}`)).data.data,
    enabled: !!orderId,
  });

  const submit = async (status: 'success' | 'fail') => {
    if (!orderId) return;
    setProcessing(true);
    try {
      await api.post(`/payment/sandbox/${orderId}/${status}`);
      toast.success('পেমেন্ট প্রসেস সম্পন্ন');
      router.push(`/orders?payment=${status === 'success' ? 'success' : 'failed'}`);
    } catch (err) {
      toast.error(apiErrorMessage(err));
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-24">
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-3xl">
            🔒
          </div>
          <h1 className="mt-4 text-2xl font-bold">স্যান্ডবক্স পেমেন্ট গেটওয়ে</h1>
          <p className="mt-2 text-sm text-gray-500">
            এটি একটি ডেমো পেমেন্ট পেজ। প্রকৃত SSLCommerz / bKash গেটওয়ে লাইভ ক্রেডেনশিয়াল দিলে সংযুক্ত হয়।
          </p>

          <div className="mt-6 rounded-xl bg-gray-50 p-4 text-left text-sm">
            <div className="flex justify-between py-1">
              <span className="text-gray-500">ট্রানজেকশন আইডি</span>
              <span className="font-mono text-xs">{txid || 'SANDBOX-0001'}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">পেমেন্ট পদ্ধতি</span>
              <span>bKash (সিমুলেটেড)</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 py-1 pt-2 font-semibold">
              <span>মোট</span>
              <span className="text-brand-600">{formatTaka(data?.order.grandTotal ?? 0)}</span>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            "পেমেন্ট সম্পন্ন করুন" চাপলে অর্ডারটি সফল পেমেন্ট হিসেবে চিহ্নিত হবে।
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <Button size="lg" loading={processing} onClick={() => submit('success')}>
              ✓ পেমেন্ট সম্পন্ন করুন
            </Button>
            <Button variant="outline" disabled={processing} onClick={() => submit('fail')}>
              পেমেন্ট বাতিল করুন
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockPaymentPage() {
  return (
    <Suspense fallback={null}>
      <MockGateway />
    </Suspense>
  );
}