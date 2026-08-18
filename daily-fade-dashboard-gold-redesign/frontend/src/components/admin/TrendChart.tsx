interface TrendChartProps {
  points: { date: string; value: number }[]
  formatValue?: (value: number) => string
  barColorVar?: string
  emptyMessage?: string
}

/**
 * Minimal dependency-free SVG bar chart. The project has no charting
 * library installed (recharts/chart.js/etc.), so trends are rendered as a
 * simple scaled bar row instead of pulling in a new dependency.
 */
export function TrendChart({
  points,
  formatValue = (v) => String(v),
  barColorVar = '--admin-accent',
  emptyMessage = 'No data for this range.',
}: TrendChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-[var(--admin-text-muted)]">{emptyMessage}</div>
    )
  }

  const max = Math.max(...points.map((p) => p.value), 1)

  return (
    <div className="flex h-40 items-end gap-1.5">
      {points.map((point) => {
        const heightPct = Math.max((point.value / max) * 100, point.value > 0 ? 4 : 1.5)
        return (
          <div key={point.date} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
            <div
              className="w-full rounded-t-sm transition-opacity group-hover:opacity-80"
              style={{ height: `${heightPct}%`, backgroundColor: `var(${barColorVar})`, minHeight: '3px' }}
              title={`${point.date}: ${formatValue(point.value)}`}
            />
            <span className="w-full truncate text-center text-[10px] text-[var(--admin-text-subtle)]">
              {point.date.slice(5)}
            </span>
          </div>
        )
      })}
    </div>
  )
}
