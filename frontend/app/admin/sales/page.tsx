'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/misc';
import { formatTaka } from '@/lib/format';

interface SalesReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalOrders: number;
  avgOrderValue: number;
  byPaymentType: Record<string, { orders: number; revenue: number }>;
  perDay: Record<string, { orders: number; revenue: number }>;
}

export default function AdminSalesPage() {
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [from, setFrom] = useState(thirtyDaysAgo);
  const [to, setTo] = useState(today);
  const [queryParams, setQueryParams] = useState({ from, to });

  const { data, isLoading } = useQuery<{ report: SalesReport }>({
    queryKey: ['admin', 'sales', queryParams],
    queryFn: async () =>
      (await api.get(`/admin/reports/sales?from=${queryParams.from}&to=${queryParams.to}`)).data.data,
  });

  const report = data?.report;
  const days = report ? Object.entries(report.perDay).sort(([a], [b]) => a.localeCompare(b)) : [];
  const maxDay = days.reduce((m, [, v]) => Math.max(m, v.revenue), 1);

  return (
    <div>
      <h1 className="text-2xl font-bold">বিক্রয় রিপোর্ট</h1>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm text-gray-600">
          থেকে
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="ml-2 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm text-gray-600">
          পর্যন্ত
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="ml-2 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <Button onClick={() => setQueryParams({ from, to })}>রিপোর্ট দেখুন</Button>
      </div>

      {isLoading ? (
        <Spinner className="my-24" />
      ) : report ? (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">মোট আয়</p>
              <p className="mt-1 text-2xl font-bold text-brand-600">{formatTaka(report.totalRevenue)}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">মোট অর্ডার</p>
              <p className="mt-1 text-2xl font-bold">{report.totalOrders}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <p className="text-sm text-gray-500">গড় অর্ডার মূল্য</p>
              <p className="mt-1 text-2xl font-bold">{formatTaka(report.avgOrderValue)}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {/* Chart */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold">দৈনিক আয় ({days.length} দিন)</h2>
              <div className="mt-4 flex h-40 items-end gap-1">
                {days.map(([day, v]) => (
                  <div key={day} className="group relative flex-1">
                    <div
                      className="rounded-t bg-brand-500 transition group-hover:bg-brand-600"
                      style={{ height: `${Math.max((v.revenue / maxDay) * 100, 3)}%` }}
                      title={`${day}: ${formatTaka(v.revenue)} (${v.orders} অর্ডার)`}
                    />
                  </div>
                ))}
                {days.length === 0 && <p className="text-sm text-gray-400">এই সময়ে কোনো অর্ডার নেই</p>}
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                <span>{days[0]?.[0]}</span>
                <span>{days[days.length - 1]?.[0]}</span>
              </div>
            </div>

            {/* By payment type */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5">
              <h2 className="text-base font-semibold">পেমেন্ট পদ্ধতি অনুযায়ী</h2>
              <ul className="mt-4 space-y-3">
                {Object.entries(report.byPaymentType).map(([method, v]) => (
                  <li key={method} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium">{method}</p>
                      <p className="text-xs text-gray-400">{v.orders} অর্ডার</p>
                    </div>
                    <span className="font-semibold">{formatTaka(v.revenue)}</span>
                  </li>
                ))}
                {Object.keys(report.byPaymentType).length === 0 && (
                  <li className="py-6 text-center text-sm text-gray-400">কোনো বিক্রয় নেই</li>
                )}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-10 text-center text-gray-500">রিপোর্ট লোড করা যায়নি</p>
      )}
    </div>
  );
}