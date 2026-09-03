'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { api, apiErrorMessage } from '@/lib/api';
import { Order, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { formatTaka, formatDateTime, statusColor, orderStatusLabel, paymentStatusLabel } from '@/lib/format';

const STATUSES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery<{ orders: Order[]; total: number; totalPages: number; page: number }>({
    queryKey: ['admin', 'orders', page, status, search],
    queryFn: async () => {
      const p = new URLSearchParams({ page: String(page), limit: '15' });
      if (status) p.set('status', status);
      if (search) p.set('search', search);
      return (await api.get(`/admin/orders?${p.toString()}`)).data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) =>
      (await api.patch(`/admin/orders/${id}`, { status })).data,
    onSuccess: () => {
      toast.success('অর্ডার স্ট্যাটাস আপডেট হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">অর্ডার ব্যবস্থাপনা</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as '' | OrderStatus);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        >
          <option value="">সব স্ট্যাটাস</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{orderStatusLabel(s)}</option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="অর্ডার নম্বর দিয়ে খুঁজুন..."
          className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        />
      </div>

      {isLoading ? (
        <Spinner className="my-24" />
      ) : (data?.orders.length ?? 0) === 0 ? (
        <div className="mt-8">
          <EmptyState title="কোনো অর্ডার নেই" />
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {(data?.orders ?? []).map((o) => (
            <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{o.orderNumber}</h3>
                    <Badge className={statusColor(o.status)}>{orderStatusLabel(o.status)}</Badge>
                    <Badge className={statusColor(o.paymentStatus)}>{paymentStatusLabel(o.paymentStatus)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {o.user?.name} · {o.user?.phone || o.user?.email} · {formatDateTime(o.createdAt)}
                  </p>
                  {o.address && (
                    <p className="mt-1 text-xs text-gray-400">
                      📍 {o.address.fullAddress}, {o.address.thana}, {o.address.district}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-brand-600">{formatTaka(o.grandTotal)}</p>
                  <p className="text-xs text-gray-400">{o.items.length} টি আইটেম</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <select
                  value={o.status}
                  onChange={(e) => statusMutation.mutate({ id: o.id, status: e.target.value as OrderStatus })}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm outline-none focus:border-brand-400 disabled:opacity-50"
                  disabled={statusMutation.isPending}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>{orderStatusLabel(s)}</option>
                  ))}
                </select>
                {o.payment?.gatewayRef && (
                  <span className="text-xs text-gray-400">ট্রানজেকশন: {o.payment.gatewayRef}</span>
                )}
              </div>
            </div>
          ))}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← আগে
              </Button>
              <span className="text-sm text-gray-500">পেজ {page} / {data.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                পরে →
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}