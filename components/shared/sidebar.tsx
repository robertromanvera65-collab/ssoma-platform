'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import {
  LayoutDashboard,
  AlertTriangle,
  HardHat,
  GraduationCap,
  ClipboardCheck,
  ShieldCheck,
  Users,
  Users2,
  Building2,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Panel principal', icon: LayoutDashboard },
  { href: '/dashboard/proyectos', label: 'Proyectos', icon: Building2 },
  { href: '/dashboard/incidentes', label: 'Incidentes', icon: AlertTriangle },
  { href: '/dashboard/epp', label: 'EPP', icon: HardHat },
  { href: '/dashboard/capacitaciones', label: 'Capacitaciones', icon: GraduationCap },
  { href: '/dashboard/inspecciones', label: 'Inspecciones', icon: ClipboardCheck },
  { href: '/dashboard/personal', label: 'Personal', icon: Users2 },
];

const adminNavItem = { href: '/dashboard/admin', label: 'Administración', icon: Users };

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const items = isAdmin ? [...navItems, adminNavItem] : navItems;

  return (
    <aside className="flex h-full w-60 flex-col border-r border-border/60 bg-card">
      <div className="flex items-center gap-3 border-b border-border/60 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold leading-tight">SSOMA</p>
          <p className="text-xs text-muted-foreground">Gestión de seguridad</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border/60 p-3">
        <p className="px-3 text-xs text-muted-foreground">
          © 2026 SSOMA Platform
        </p>
      </div>
    </aside>
  );
}
