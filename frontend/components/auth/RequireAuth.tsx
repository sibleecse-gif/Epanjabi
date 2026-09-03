'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/misc';

export function RequireAuth({ children, admin = false }: { children: React.ReactNode; admin?: boolean }) {
  const { user, hydrated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(pathname)}`);
    } else if (admin && user.role === 'USER') {
      router.push('/');
    }
  }, [hydrated, user, router, pathname, admin]);

  if (!hydrated || !user || (admin && user.role === 'USER')) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}