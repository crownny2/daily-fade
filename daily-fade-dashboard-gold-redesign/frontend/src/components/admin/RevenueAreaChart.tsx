interface RevenueAreaChartProps {
  points: { label: string; value: number }[]
  formatValue?: (value: number) => string
  emptyMessage?: string
}

/**
 * Minimal dependency-free SVG line/area chart for the Revenue Overview card.
 * No charting library is installed in this project, so the trend is drawn
 * as a scaled gold line with a soft area fill instead of pulling in a new
 * dependency.
 */
export function RevenueAreaChart({
  points,
  formatValue = (v) => String(v),
  emptyMessage = 'No revenue recorded for this range.',
}: RevenueAreaChartProps) {
  if (points.length === 0) {
    return (
      <div className="flex h-56 items-center justify-center text-sm text-[var(--admin-text-muted)]">
        {emptyMessage}
      </div>
    )
  }

  const width = 700
  const height = 220
  const padTop = 16
  const padBottom = 28
  const padX = 8
  const plotHeight = height - padTop - padBottom
  const max = Math.max(...points.map((p) => p.value), 1)

  const stepX = points.length > 1 ? (width - padX * 2) / (points.length - 1) : 0
  const coords = points.map((p, i) => {
    const x = padX + i * stepX
    const y = padTop + plotHeight - (p.value / max) * plotHeight
    return { x, y, ...p }
  })

  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ')
  const areaPath = `${linePath} L ${coords[coords.length - 1].x} ${padTop + plotHeight} L ${coords[0].x} ${padTop + plotHeight} Z`

  const gridLines = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-56 w-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueAreaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--admin-accent)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--admin-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Subtle horizontal grid lines */}
        {gridLines.map((g) => {
          const y = padTop + plotHeight * g
          return (
            <line
              key={g}
              x1={padX}
              x2={width - padX}
              y1={y}
              y2={y}
              stroke="var(--admin-border)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          )
        })}

        <path d={areaPath} fill="url(#revenueAreaFill)" stroke="none" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--admin-accent)"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {coords.map((c) => (
          <g key={c.label} className="group">
            <circle cx={c.x} cy={c.y} r={3.5} fill="var(--admin-surface)" stroke="var(--admin-accent)" strokeWidth={2} />
            <title>{`${c.label}: ${formatValue(c.value)}`}</title>
          </g>
        ))}
      </svg>

      <div className="mt-1 flex justify-between px-1 text-[10px] text-[var(--admin-text-subtle)]">
        {points.map((p) => (
          <span key={p.label}>{p.label}</span>
        ))}
      </div>
    </div>
  )
}
