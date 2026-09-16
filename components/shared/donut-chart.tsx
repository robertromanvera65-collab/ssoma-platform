type DonutSegment = { label: string; value: number; color: string };

export function DonutChart({ segments, size = 160 }: { segments: DonutSegment[]; size?: number }) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={16}
          />
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circumference;
            const circle = (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={16}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                className="transition-all duration-500"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{total}</span>
          <span className="text-xs text-muted-foreground">Total</span>
        </div>
      </div>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="h-3 w-3 rounded-full" style={{ background: seg.color }} />
            <span className="text-muted-foreground">{seg.label}</span>
            <span className="font-medium">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
