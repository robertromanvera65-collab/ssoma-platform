'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function Topbar({ title }: { title: string }) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const initials = (profile?.full_name || user?.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-card/50 px-6 backdrop-blur-sm">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">
                {profile?.full_name || 'Usuario'}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled className="gap-2 opacity-60">
            <UserIcon className="h-4 w-4" />
            {profile?.role || 'Sin rol asignado'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
