export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'APPROVED' | 'FAILED' | 'REFUNDED';
export type PaymentType = 'COD' | 'BKASH' | 'NAGAD' | 'ROCKET' | 'CARD' | 'INTERNET_BANKING';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  avatar?: string | null;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: Tokens;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string | null;
  description?: string | null;
  _count?: { products: number };
}

export interface ProductImage {
  id: string;
  url: string;
  alt?: string | null;
  isPrimary: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  categoryId: string;
  category: { id: string; name: string; slug: string };
  sizes: string[];
  stock: number;
  sku: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  images: ProductImage[];
  related?: Product[];
}

export interface ListingResponse {
  products: Product[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
}

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  fullAddress: string;
  district: string;
  thana: string;
  postcode?: string | null;
  isDefault: boolean;
}

export interface CartItem {
  id: string;
  userId?: string;
  productId: string;
  name: string;
  price: number;
  image?: string;
  size: string;
  qty: number;
  stock: number;
}

export interface ServerCartItem {
  id: string;
  qty: number;
  size: string;
  product: {
    id: string;
    name: string;
    price: number;
    stock: number;
    images: ProductImage[];
  };
}

export interface ServerCart {
  items: ServerCartItem[];
  subtotal: number;
  totalItems: number;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  productId: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  grandTotal: number;
  status: OrderStatus;
  paymentType: PaymentType;
  paymentStatus: PaymentStatus;
  transactionId?: string | null;
  notes?: string | null;
  createdAt: string;
  items: OrderItem[];
  user?: { name?: string; email?: string; phone?: string } | null;
  address?: { district: string; thana: string; fullAddress: string };
  payment?: { id: string; method: PaymentType; status: PaymentStatus; gatewayRef?: string | null } | null;
}

export interface AdminDashboard {
  revenue: { today: { amount: number; orders: number }; week: { amount: number; orders: number }; month: { amount: number; orders: number }; year: { amount: number; orders: number } };
  totalOrders: number;
  pendingOrders: number;
  pendingPayments: number;
  totalProducts: number;
  totalUsers: number;
  lowStock: number;
  recentOrders: Order[];
  topSelling: { id: string; name: string; price: number; totalQty: number }[];
}

export interface Paginated<T> {
  data: T;
  total?: number;
  totalPages?: number;
  page?: number;
  limit?: number;
}