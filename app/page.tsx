'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { loading, session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(session ? '/dashboard' : '/login');
    }
  }, [loading, session, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
