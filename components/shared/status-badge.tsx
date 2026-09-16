import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const statusConfig: Record<string, { label: string; className: string }> = {
  reportado: { label: 'Reportado', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  investigando: { label: 'Investigando', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  cerrado: { label: 'Cerrado', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  programada: { label: 'Programada', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  completada: { label: 'Completada', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  cancelada: { label: 'Cancelada', className: 'bg-red-100 text-red-700 border-red-200' },
  'en-proceso': { label: 'En proceso', className: 'bg-amber-100 text-amber-700 border-amber-200' },
};

const severityConfig: Record<string, { label: string; className: string }> = {
  leve: { label: 'Leve', className: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  moderado: { label: 'Moderado', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  grave: { label: 'Grave', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  critico: { label: 'Crítico', className: 'bg-red-100 text-red-700 border-red-200' },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || { label: status, className: '' };
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity] || { label: severity, className: '' };
  return (
    <Badge variant="outline" className={cn('font-medium', config.className)}>
      {config.label}
    </Badge>
  );
}
