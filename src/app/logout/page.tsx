'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { clearStoredUser } from '@/lib/authStorage';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    clearStoredUser();
    router.replace('/sign-in');
  }, [router]);

  return null;
}
