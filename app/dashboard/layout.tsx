'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/shared/sidebar';
import { Topbar } from '@/components/shared/topbar';
import { Loader2 } from 'lucide-react';

const titleMap: Record<string, string> = {
  '/dashboard': 'Panel principal',
  '/dashboard/incidentes': 'Gestión de incidentes',
  '/dashboard/epp': 'Equipos de protección personal',
  '/dashboard/capacitaciones': 'Capacitaciones',
  '/dashboard/inspecciones': 'Inspecciones',
  '/dashboard/personal': 'Personal',
  '/dashboard/admin': 'Administración',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { loading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/login');
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar title={titleMap[pathname] || 'SSOMA'} />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
