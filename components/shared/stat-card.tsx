import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: 'default' | 'warning' | 'danger' | 'success';
};

const variantStyles = {
  default: 'text-primary bg-accent/50',
  warning: 'text-warning bg-warning/10',
  danger: 'text-destructive bg-destructive/10',
  success: 'text-success bg-success/10',
};

export function StatCard({ title, value, icon: Icon, trend, variant = 'default' }: StatCardProps) {
  return (
    <Card className="overflow-hidden border-border/60 transition-shadow hover:shadow-md">
      <CardContent className="flex items-center justify-between p-5">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          {trend && <p className="text-xs text-muted-foreground">{trend}</p>}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl', variantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}
