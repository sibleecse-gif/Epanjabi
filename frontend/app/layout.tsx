import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: { default: 'আগদুম ফ্যাশন | Aagdoom Fashion', template: '%s | Aagdoom Fashion' },
  description: 'বাংলাদেশের ফ্যাশন ই-কমার্স — শার্ট, পাঞ্জাবি, টি-শার্ট, প্যান্ট এবং আরও অনেক কিছু।',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-gray-50 font-sans text-gray-900 antialiased">
        <Providers>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </Providers>
      </body>
    </html>
  );
}