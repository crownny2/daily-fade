export function formatCurrency(value: string | number): string {
  const amount = typeof value === 'string' ? parseFloat(value) : value
  if (Number.isNaN(amount)) return '₱0'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
  }).format(amount)
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} hr` : `${hours} hr ${rest} min`
}

export function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

/** Full weekday + full month, used on the booking flow's Time/Details/Review steps. */
export function formatDateLong(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`)
  return date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(h, m, 0, 0)
  return date.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
}

/** "3m ago", "2h ago", "5d ago" — falls back to a short date further out. */
export function timeAgo(isoString: string): string {
  const date = new Date(isoString)
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)

  if (diffSec < 5) return 'just now'
  if (diffSec < 60) return `${diffSec}s ago`

  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`

  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`

  const diffDay = Math.round(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`

  return date.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function statusLabel(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
}

/** "gcash" -> "GCash", "maya" -> "Maya", "cash" -> "Cash" (falls back to statusLabel for anything unrecognized). */
export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_LABELS[method] ?? statusLabel(method)
}
