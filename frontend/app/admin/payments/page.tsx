'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { PaymentType, PaymentStatus, Order } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { formatTaka, formatDateTime, paymentStatusLabel, paymentTypeLabel, statusColor } from '@/lib/format';

interface Payment {
  id: string;
  method: PaymentType;
  amount: number;
  status: PaymentStatus;
  gatewayRef?: string | null;
  createdAt: string;
  order: Order;
}

export default function AdminPaymentsPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'' | PaymentStatus>('');

  const { data, isLoading } = useQuery<{ payments: Payment[]; total: number }>({
    queryKey: ['admin', 'payments', status],
    queryFn: async () => {
      const p = new URLSearchParams({ limit: '50' });
      if (status) p.set('status', status);
      return (await api.get(`/admin/payments?${p.toString()}`)).data.data;
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: 'approve' | 'reject' }) =>
      (await api.patch(`/admin/payments/${id}`, { action })).data,
    onSuccess: () => {
      toast.success('পেমেন্ট রিভিউ সম্পন্ন');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">পেমেন্ট অ্যাপ্রোভাল</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'FAILED', 'REFUNDED'] as PaymentStatus[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(status === s ? '' : s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
              status === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:border-gray-400'
            }`}
          >
            {paymentStatusLabel(s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="my-24" />
      ) : (data?.payments.length ?? 0) === 0 ? (
        <div className="mt-8">
          <EmptyState title="কোনো পেমেন্ট নেই" description="এই ফিল্টারে কোনো পেমেন্ট পাওয়া যায়নি" />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">অর্ডার</th>
                <th className="px-4 py-3">গ্রাহক</th>
                <th className="px-4 py-3">পদ্ধতি</th>
                <th className="px-4 py-3">পরিমাণ</th>
                <th className="px-4 py-3">স্ট্যাটাস</th>
                <th className="px-4 py-3">ট্রানজেকশন</th>
                <th className="px-4 py-3 text-right">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.payments ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.order.orderNumber}</td>
                  <td className="px-4 py-3 text-gray-500">{p.order.user?.name ?? '—'}</td>
                  <td className="px-4 py-3">{paymentTypeLabel(p.method)}</td>
                  <td className="px-4 py-3 font-semibold">{formatTaka(p.amount)}</td>
                  <td className="px-4 py-3">
                    <Badge className={statusColor(p.status)}>{paymentStatusLabel(p.status)}</Badge>
                  </td>
                  <td className="max-w-[140px] truncate px-4 py-3 font-mono text-xs text-gray-400">
                    {p.gatewayRef ?? '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {p.status === 'PENDING' || p.status === 'PROCESSING' ? (
                        <>
                          <Button size="sm" onClick={() => reviewMutation.mutate({ id: p.id, action: 'approve' })}>
                            অনুমোদন
                          </Button>
                          <Button size="sm" variant="danger" onClick={() => reviewMutation.mutate({ id: p.id, action: 'reject' })}>
                            প্রত্যাখ্যান
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">{formatDateTime(p.createdAt)}</span>
                      )}
                    </div>
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