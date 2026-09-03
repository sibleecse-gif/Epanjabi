export function formatTaka(amount: number): string {
  return `৳${amount.toLocaleString('en-IN')}`;
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  APPROVED: 'Approved',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  COD: 'Cash on Delivery',
  BKASH: 'bKash',
  NAGAD: 'Nagad',
  ROCKET: 'Rocket',
  CARD: 'Card',
  INTERNET_BANKING: 'Internet Banking',
};

export function orderStatusLabel(s: string): string {
  return ORDER_STATUS_LABELS[s] ?? s;
}

export function paymentStatusLabel(s: string): string {
  return PAYMENT_STATUS_LABELS[s] ?? s;
}

export function paymentTypeLabel(s: string): string {
  return PAYMENT_TYPE_LABELS[s] ?? s;
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-800',
    CONFIRMED: 'bg-sky-100 text-sky-800',
    PROCESSING: 'bg-indigo-100 text-indigo-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-emerald-100 text-emerald-800',
    APPROVED: 'bg-emerald-100 text-emerald-800',
    FAILED: 'bg-rose-100 text-rose-800',
    CANCELLED: 'bg-rose-100 text-rose-800',
    RETURNED: 'bg-gray-200 text-gray-700',
    REFUNDED: 'bg-gray-200 text-gray-700',
  };
  return map[status] ?? 'bg-gray-100 text-gray-700';
}