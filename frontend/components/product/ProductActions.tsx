'use client';

import { useState } from 'react';
import { Minus, Plus, ShoppingCart } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';

interface Props {
  product: {
    id: string;
    name: string;
    price: number;
    sizes: string[];
    stock: number;
    image?: string;
  };
  compact?: boolean;
}

export function SizeSelector({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string;
  onChange: (size: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => onChange(size)}
          className={`min-w-10 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            value === size
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-gray-300 bg-white text-gray-700 hover:border-brand-400'
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}

export function QuantitySelector({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (qty: number) => void;
}) {
  return (
    <div className="flex items-center rounded-lg border border-gray-300">
      <button
        type="button"
        className="px-3 py-2 text-gray-500 hover:text-gray-900 disabled:opacity-40"
        disabled={value <= 1}
        onClick={() => onChange(value - 1)}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-10 text-center text-sm font-semibold">{value}</span>
      <button
        type="button"
        className="px-3 py-2 text-gray-500 hover:text-gray-900 disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

export function AddToCartButton({ product, compact }: Props) {
  const { addItem } = useCart();
  const { setOpenCart } = useCart();
  const [size, setSize] = useState(product.sizes[0] ?? 'M');
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (product.stock <= 0) return;
    setAdding(true);
    try {
      await addItem({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        size,
        qty,
        stock: product.stock,
      });
      toast.success(`${product.name} কার্টে যোগ হয়েছে`);
      if (compact) setOpenCart(true);
    } catch {
      toast.error('কার্টে যোগ করা যায়নি');
    } finally {
      setAdding(false);
    }
  };

  if (compact) {
    return (
      <Button onClick={handleAdd} loading={adding} disabled={product.stock <= 0} className="w-full">
        <ShoppingCart className="h-4 w-4" /> {product.stock <= 0 ? 'স্টক নেই' : 'কার্টে যোগ করুন'}
      </Button>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">সাইজ নির্বাচন করুন</h4>
        <SizeSelector sizes={product.sizes} value={size} onChange={setSize} />
      </div>
      <div>
        <h4 className="mb-2 text-sm font-semibold text-gray-900">পরিমাণ</h4>
        <QuantitySelector value={qty} max={Math.max(product.stock, 1)} onChange={setQty} />
      </div>
      <Button onClick={handleAdd} loading={adding} disabled={product.stock <= 0} size="lg" className="w-full">
        <ShoppingCart className="h-4 w-4" />
        {product.stock <= 0 ? 'স্টক নেই' : 'কার্টে যোগ করুন'}
      </Button>
      <p className="text-xs text-gray-500">{product.stock} টি স্টকে আছে</p>
    </div>
  );
}