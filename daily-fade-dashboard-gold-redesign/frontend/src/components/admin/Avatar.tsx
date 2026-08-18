import { cn } from '@/utils/cn'

const PALETTE = [
  'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]',
  'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
  'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]',
  'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
]

function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  name,
  size = 'md',
}: {
  name: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const tone = PALETTE[hashString(name) % PALETTE.length]
  const sizeClasses = {
    sm: 'h-7 w-7 text-[10px]',
    md: 'h-9 w-9 text-xs',
    lg: 'h-12 w-12 text-sm',
  }[size]

  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizeClasses,
        tone
      )}
    >
      {initials(name)}
    </span>
  )
}
