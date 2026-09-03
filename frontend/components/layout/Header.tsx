'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, Package, Search, ShoppingCart, User, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import toast from 'react-hot-toast';

export function Header() {
  const { user, logout, isAuthed } = useAuth();
  const { totalItems, setOpenCart } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/shop?q=${encodeURIComponent(search.trim())}`);
  };

  const navLink = (href: string, label: string, active = false) => (
    <Link
      href={href}
      className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? 'text-brand-600' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6">
        <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Package className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-bold tracking-tight sm:block">
            আগদুম<span className="text-brand-600"> ফ্যাশন</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 lg:flex">
          {navLink('/', 'হোম')}
          {navLink('/shop', 'সব পণ্য', pathname.startsWith('/shop'))}
        </nav>

        <form onSubmit={onSearch} className="mx-auto hidden w-full max-w-md flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="খুঁজুন... শার্ট, পাঞ্জাবি"
              className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setOpenCart(true)}
            className="relative rounded-lg p-2.5 text-gray-700 hover:bg-gray-100"
            aria-label="Cart"
          >
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">
                {totalItems}
              </span>
            )}
          </button>

          {isAuthed ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-900 text-sm font-bold text-white hover:bg-gray-800"
              >
                {user?.name?.charAt(0) ?? 'U'}
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-12 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="border-b border-gray-100 px-4 py-3">
                    <p className="text-sm font-semibold">{user?.name}</p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    {user?.role !== 'USER' && (
                      <Link href="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        অ্যাডমিন প্যানেল
                      </Link>
                    )}
                    <Link href="/orders" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      আমার অর্ডার
                    </Link>
                    <Link href="/account" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                      প্রোফাইল ও ঠিকানা
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        toast.success('লগ আউট সম্পন্ন');
                        router.push('/');
                      }}
                      className="block w-full px-4 py-2 text-left text-sm text-rose-600 hover:bg-rose-50"
                    >
                      লগ আউট
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 sm:block">
                লগইন
              </Link>
              <Link
                href="/register"
                className="hidden rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 sm:block"
              >
                রেজিস্ট্রেশন
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-72 bg-white p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-lg font-bold">আগদুম ফ্যাশন</span>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={onSearch} className="relative mb-4 md:hidden">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="খুঁজুন..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm outline-none"
              />
            </form>
            <nav className="flex flex-col gap-1">
              {navLink('/', 'হোম')}
              {navLink('/shop', 'সব পণ্য')}
              {!isAuthed && navLink('/login', 'লগইন')}
              {!isAuthed && navLink('/register', 'রেজিস্ট্রেশন')}
              {isAuthed && navLink('/orders', 'আমার অর্ডার')}
              {isAuthed && navLink('/account', 'প্রোফাইল ও ঠিকানা')}
              {isAuthed && user?.role !== 'USER' && navLink('/admin', 'অ্যাডমিন প্যানেল')}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}