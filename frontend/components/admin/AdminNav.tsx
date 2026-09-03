'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingCart, CreditCard, Users, BarChart3, Tag } from 'lucide-react';

const links = [
  { href: '/admin', label: 'ড্যাশবোর্ড', icon: LayoutDashboard, exact: true },
  { href: '/admin/products', label: 'পণ্য', icon: Package },
  { href: '/admin/orders', label: 'অর্ডার', icon: ShoppingCart },
  { href: '/admin/payments', label: 'পেমেন্ট', icon: CreditCard },
  { href: '/admin/users', label: 'ব্যবহারকারী', icon: Users },
  { href: '/admin/sales', label: 'বিক্রয় রিপোর্ট', icon: BarChart3 },
  { href: '/admin/categories', label: 'ক্যাটাগরি', icon: Tag },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {links.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              active ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <l.icon className="h-4 w-4" />
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}