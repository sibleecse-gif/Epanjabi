import Link from 'next/link';
import { Package, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-gray-50">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Package className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">আগদুম ফ্যাশন</span>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            বাংলাদেশের ফ্যাশনপ্রেমীদের জন্য আধুনিক ও ঐতিহ্যবাহী পোশাক। গুণগত মানে আপসহীন।
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">ক্যাটাগরি</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li><Link href="/shop?category=shirt" className="hover:text-brand-600">শার্ট</Link></li>
            <li><Link href="/shop?category=punjabi" className="hover:text-brand-600">পাঞ্জাবি</Link></li>
            <li><Link href="/shop?category=t-shirt" className="hover:text-brand-600">টি-শার্ট</Link></li>
            <li><Link href="/shop?category=pant" className="hover:text-brand-600">প্যান্ট</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">গ্রাহক সেবা</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li><Link href="/shop" className="hover:text-brand-600">সব পণ্য</Link></li>
            <li><Link href="/cart" className="hover:text-brand-600">কার্ট</Link></li>
            <li><Link href="/orders" className="hover:text-brand-600">অর্ডার ট্র্যাক</Link></li>
            <li><Link href="/register" className="hover:text-brand-600">রেজিস্ট্রেশন</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-900">যোগাযোগ</h4>
          <ul className="mt-3 space-y-2 text-sm text-gray-500">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> 01612-000000</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> support@aagdoom.com</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> ঢাকা, বাংলাদেশ</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gray-200 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Aagdoom Fashion — All rights reserved.
      </div>
    </footer>
  );
}