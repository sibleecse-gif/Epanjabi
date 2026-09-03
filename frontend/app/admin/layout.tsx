'use client';

import { RequireAuth } from '@/components/auth/RequireAuth';
import { AdminNav } from '@/components/admin/AdminNav';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth admin>
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:flex-row">
        <aside className="w-full flex-none lg:w-56">
          <div className="rounded-2xl border border-gray-200 bg-white p-3 lg:sticky lg:top-20">
            <div className="mb-3 px-3 pt-2">
              <h3 className="text-sm font-bold">অ্যাডমিন প্যানেল</h3>
              <p className="text-xs text-gray-500">Aagdoom Fashion</p>
            </div>
            <AdminNav />
            <Link
              href="/"
              className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-gray-400 hover:bg-gray-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> স্টোরে ফিরুন
            </Link>
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </RequireAuth>
  );
}