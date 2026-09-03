'use client';

import Link from 'next/link';
import { Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { Order } from '@/lib/types';
import { api, apiErrorMessage } from '@/lib/api';
import { Spinner, EmptyState, Badge } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { formatDateTime, formatTaka, orderStatusLabel, paymentStatusLabel, paymentTypeLabel, statusColor } from '@/lib/format';

function PaymentToast() {
  const searchParams = useSearchParams();
  const status = searchParams.get('payment');
  useEffect(() => {
    if (status === 'success') toast.success('পেমেন্ট সফল হয়েছে');
    else if (status === 'failed') toast.error('পেমেন্ট ব্যর্থ হয়েছে');
    else if (status === 'cancelled') toast('পেমেন্ট বাতিল করা হয়েছে');
  }, [status]);
  return null;
}

function OrdersContent() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<{ orders: Order[] }>({
    queryKey: ['orders'],
    queryFn: async () => (await api.get('/orders')).data.data,
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => (await api.patch(`/orders/${id}/cancel`)).data,
    onSuccess: () => {
      toast.success('অর্ডার বাতিল করা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const orders = data?.orders ?? [];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PaymentToast />
      <h1 className="text-2xl font-bold">আমার অর্ডার</h1>

      {isLoading ? (
        <Spinner className="my-24" />
      ) : orders.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="কোনো অর্ডার নেই"
            description="আপনার প্রথম অর্ডারটি করুন"
            action={
              <Link href="/shop">
                <Button>শপিং শুরু করুন</Button>
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={statusColor(order.status)}>{orderStatusLabel(order.status)}</Badge>
                  <Badge className={statusColor(order.paymentStatus)}>{paymentStatusLabel(order.paymentStatus)}</Badge>
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                পেমেন্ট: {paymentTypeLabel(order.paymentType)}
                {order.transactionId && <span className="ml-1">· ট্রানজেকশন: {order.transactionId}</span>}
                {order.payment?.gatewayRef && <span className="ml-1">· রেফ: {order.payment.gatewayRef}</span>}
              </p>

              <ul className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-100">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-gray-700">
                      {item.name} <span className="text-gray-400">(সাইজ: {item.size})</span>
                    </span>
                    <span className="font-medium">{item.qty} × {formatTaka(item.price)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="text-gray-500">সর্বমোট: </span>
                  <span className="font-bold text-brand-600">{formatTaka(order.grandTotal)}</span>
                  {order.address && (
                    <span className="ml-3 text-xs text-gray-400">
                      {order.address.district}, {order.address.thana}
                    </span>
                  )}
                </div>
                {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
                  <Button
                    variant="outline"
                    size="sm"
                    loading={cancelMutation.isPending}
                    onClick={() => cancelMutation.mutate(order.id)}
                  >
                    অর্ডার বাতিল
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <RequireAuth>
      <Suspense fallback={null}>
        <OrdersContent />
      </Suspense>
    </RequireAuth>
  );
}