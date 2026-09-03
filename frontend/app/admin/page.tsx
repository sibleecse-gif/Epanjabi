'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Banknote, ShoppingBag, CircleDollarSign, Package, AlertTriangle, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { AdminDashboard } from '@/lib/types';
import { Badge, Spinner } from '@/components/ui/misc';
import { Button } from '@/components/ui/Button';
import { formatTaka, formatDateTime, statusColor, orderStatusLabel, paymentStatusLabel } from '@/lib/format';

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery<{ stats: AdminDashboard }>({
    queryKey: ['admin', 'dashboard'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data,
  });

  if (isLoading) return <Spinner className="my-24" />;
  if (!data) return <p className="mt-10 text-center text-gray-500">ড্যাশবোর্ড লোড করা যায়নি</p>;

  const s = data.stats;

  const cards = [
    { label: 'আজকের আয়', value: formatTaka(s.revenue.today.amount), sub: `${s.revenue.today.orders} অর্ডার`, icon: CircleDollarSign, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'মোট অর্ডার', value: String(s.totalOrders), sub: `${s.pendingOrders} পেন্ডিং`, icon: ShoppingBag, color: 'text-sky-600 bg-sky-50' },
    { label: 'পেন্ডিং পেমেন্ট', value: String(s.pendingPayments), sub: 'অনুমোদন প্রয়োজন', icon: Banknote, color: 'text-amber-600 bg-amber-50' },
    { label: 'মোট পণ্য', value: String(s.totalProducts), sub: `${s.lowStock} কম স্টক`, icon: Package, color: 'text-brand-600 bg-brand-50' },
    { label: 'মোট গ্রাহক', value: String(s.totalUsers), sub: 'রেজিস্টার্ড', icon: Users, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">ড্যাশবোর্ড</h1>
        <Link href="/admin/products/add">
          <Button size="sm">+ নতুন পণ্য</Button>
        </Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className={`inline-flex rounded-lg p-2 ${c.color}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-xl font-bold">{c.value}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
            <p className="mt-0.5 text-xs text-gray-400">{c.sub}</p>
          </div>
        ))}
      </div>

      {s.lowStock > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700">
          <AlertTriangle className="h-4 w-4" />
          {s.lowStock} টি পণ্যের স্টক কম (৫ বা তার কম)। স্টক আপডেট করুন।
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">সাম্প্রতিক অর্ডার</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-brand-600 hover:text-brand-700">সব দেখুন →</Link>
          </div>
          <ul className="mt-4 divide-y divide-gray-100">
            {s.recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{o.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {o.user?.name ?? '—'} · {formatDateTime(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatTaka(o.grandTotal)}</span>
                  <Badge className={statusColor(o.status)}>{orderStatusLabel(o.status)}</Badge>
                </div>
              </li>
            ))}
            {s.recentOrders.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-400">কোনো অর্ডার নেই</li>
            )}
          </ul>
        </div>

        {/* Top selling */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold">সেরা বিক্রিত পণ্য</h2>
          <ul className="mt-4 divide-y divide-gray-100">
            {s.topSelling.map((p, i) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium">{p.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{p.totalQty} টি</p>
                  <p className="text-xs text-gray-400">{formatTaka(p.price)}</p>
                </div>
              </li>
            ))}
            {s.topSelling.length === 0 && (
              <li className="py-8 text-center text-sm text-gray-400">এখনও কোনো বিক্রয় নেই</li>
            )}
          </ul>
        </div>
      </div>

      {/* Revenue overview */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-base font-semibold">রেভিনিউ ওভারভিউ</h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'আজ', amount: s.revenue.today.amount, orders: s.revenue.today.orders },
            { label: 'সপ্তাহ', amount: s.revenue.week.amount, orders: s.revenue.week.orders },
            { label: 'মাস', amount: s.revenue.month.amount, orders: s.revenue.month.orders },
            { label: 'বছর', amount: s.revenue.year.amount, orders: s.revenue.year.orders },
          ].map((r) => (
            <div key={r.label} className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-500">{r.label}</p>
              <p className="mt-1 text-lg font-bold">{formatTaka(r.amount)}</p>
              <p className="text-xs text-gray-400">{r.orders} অর্ডার</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}