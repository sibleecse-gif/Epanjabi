'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Banknote, Smartphone, CreditCard, Landmark, CheckCircle2 } from 'lucide-react';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useCart } from '@/hooks/useCart';
import { AddressForm } from '@/components/checkout/AddressForm';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/misc';
import { api, apiErrorMessage } from '@/lib/api';
import { Address, PaymentType } from '@/lib/types';
import { formatTaka } from '@/lib/format';

const DELIVERY_FEE = 60;

const PAYMENT_METHODS: { value: PaymentType; label: string; icon: React.ReactNode }[] = [
  { value: 'COD', label: 'ক্যাশ অন ডেলিভারি', icon: <Banknote className="h-5 w-5" /> },
  { value: 'BKASH', label: 'বিকাশ', icon: <Smartphone className="h-5 w-5" /> },
  { value: 'NAGAD', label: 'নগদ', icon: <Smartphone className="h-5 w-5" /> },
  { value: 'ROCKET', label: 'রকেট', icon: <Smartphone className="h-5 w-5" /> },
  { value: 'CARD', label: 'কার্ড', icon: <CreditCard className="h-5 w-5" /> },
  { value: 'INTERNET_BANKING', label: 'ইন্টারনেট ব্যাংকিং', icon: <Landmark className="h-5 w-5" /> },
];

function CheckoutContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, subtotal, totalItems, isLoading: cartLoading, clear } = useCart();
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [paymentType, setPaymentType] = useState<PaymentType>('COD');
  const [notes, setNotes] = useState('');
  const [placed, setPlaced] = useState(false);

  const { data, isLoading: addrLoading } = useQuery<{ addresses: Address[] }>({
    queryKey: ['addresses'],
    queryFn: async () => (await api.get('/users/addresses')).data.data,
  });
  const addresses = data?.addresses ?? [];

  const placeOrderMutation = useMutation({
    mutationFn: async () =>
      (await api.post('/orders', { addressId: selectedAddress, paymentType, notes })).data.data,
    onSuccess: async (data: { gatewayUrl?: string; isOnline?: boolean }) => {
      await clear();
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      setPlaced(true);
      if (data.isOnline && data.gatewayUrl) {
        window.location.href = data.gatewayUrl;
      } else {
        router.push('/orders?payment=success');
      }
    },
    onError: (err) => toast.error(apiErrorMessage(err, 'অর্ডার তৈরি করা যায়নি')),
  });

  if (cartLoading || addrLoading) return <Spinner className="my-24 mx-auto" />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <div className="text-5xl">🛒</div>
        <h1 className="mt-3 text-2xl font-bold">কার্ট খালি</h1>
        <p className="mt-2 text-sm text-gray-500">কেনাকাটা করতে শপ পেজে যান</p>
        <Link href="/shop" className="mt-5 inline-block rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          শপিং শুরু করুন
        </Link>
      </div>
    );
  }

  const grandTotal = subtotal + DELIVERY_FEE;
  const activeAddress = addresses.find((a) => a.id === selectedAddress);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold">চেকআউট</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Address */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold">ডেলিভারি ঠিকানা</h2>
            {addresses.length === 0 || showForm || !selectedAddress ? (
              <div className="mt-4">
                <AddressForm
                  onSaved={(a) => {
                    setSelectedAddress(a.id);
                    setShowForm(false);
                  }}
                  isDefault={addresses.length === 0}
                  buttonLabel="ডেলিভারি ঠিকানা যোগ করুন"
                />
              </div>
            ) : (
              <div className="mt-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {addresses.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAddress(a.id)}
                      className={`rounded-xl border p-4 text-left transition ${
                        selectedAddress === a.id ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold">{a.fullName}</span>
                        {a.isDefault && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">ডিফল্ট</span>}
                      </div>
                      <p className="mt-1 text-sm text-gray-600">{a.fullAddress}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {a.district}, {a.thana}, {a.postcode} — {a.phone}
                      </p>
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowForm(true)} className="mt-3 text-sm font-medium text-brand-600 hover:text-brand-700">
                  + নতুন ঠিকানা যোগ করুন
                </button>
              </div>
            )}
          </section>

          {/* Payment */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold">পেমেন্ট পদ্ধতি</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setPaymentType(m.value)}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition ${
                    paymentType === m.value ? 'border-brand-600 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  }`}
                >
                  <span className="text-brand-600">{m.icon}</span>
                  <span className="text-sm font-medium">{m.label}</span>
                  {paymentType === m.value && <CheckCircle2 className="ml-auto h-4 w-4 text-brand-600" />}
                </button>
              ))}
            </div>
            {paymentType !== 'COD' && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-700">
                অনলাইন পেমেন্ট একটি সিমুলেটেড গেটওয়ে দিয়ে সম্পন্ন হবে (ডেমো মোড)।
              </p>
            )}
          </section>

          {/* Notes */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5">
            <h2 className="text-base font-semibold">নোট (ঐচ্ছিক)</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              maxLength={500}
              placeholder="যেমন: বিকেল ৫টার পরে ডেলিভারি দিন"
              className="mt-3 w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </section>
        </div>

        {/* Summary */}
        <div className="h-fit rounded-2xl border border-gray-200 bg-white p-5 lg:sticky lg:top-20">
          <h2 className="text-base font-semibold">অর্ডার সারাংশ</h2>
          <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto text-sm">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between gap-2">
                <span className="min-w-0 truncate text-gray-600">
                  {item.name} <span className="text-gray-400">×{item.qty}</span>
                </span>
                <span className="font-medium">{formatTaka(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-gray-200 pt-4 text-sm">
            <div className="flex justify-between"><dt className="text-gray-500">সাবটোটাল</dt><dd>{formatTaka(subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-gray-500">ডেলিভারি</dt><dd>{formatTaka(DELIVERY_FEE)}</dd></div>
            <div className="flex justify-between text-base font-bold">
              <dt>সর্বমোট</dt>
              <dd className="text-brand-600">{formatTaka(grandTotal)}</dd>
            </div>
          </dl>
          <Button
            size="lg"
            className="mt-5 w-full"
            disabled={!selectedAddress || totalItems === 0}
            loading={placeOrderMutation.isPending}
            onClick={() => placeOrderMutation.mutate()}
          >
            অর্ডার নিশ্চিত করুন
          </Button>
          {placed && !placeOrderMutation.isPending && (
            <p className="mt-2 text-center text-xs text-emerald-600">অর্ডার সফলভাবে তৈরি হয়েছে</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  );
}