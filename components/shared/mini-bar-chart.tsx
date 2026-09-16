import { cn } from '@/lib/utils';

type BarDatum = { label: string; value: number; color?: string };

export function MiniBarChart({ data, max }: { data: BarDatum[]; max?: number }) {
  const maxValue = max ?? Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex h-40 items-end gap-3">
      {data.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-2">
          <div className="flex w-full flex-1 items-end">
            <div
              className={cn('w-full rounded-t-md transition-all duration-500', d.color || 'bg-primary')}
              style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: d.value > 0 ? '4px' : '0' }}
            />
          </div>
          <span className="text-xs text-muted-foreground">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
