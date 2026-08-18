import { cn } from '@/utils/cn'

interface LogoProps {
  /** Pixel height of the mark. Width follows automatically (logo is square). */
  size?: number
  className?: string
  /** Set false on dark noir backgrounds where a wordmark is already implied elsewhere. */
  withWordmark?: boolean
  /** Use light-colored wordmark text — for placement on dark/noir backgrounds. */
  dark?: boolean
}

/**
 * The single official Daily Fade brand mark (client-supplied artwork).
 * Never redraw, recolor, or recreate this logo — every place in the app
 * that needs the brand renders through this one component so there is
 * exactly one <img> tag, and therefore one file, to ever swap.
 */
export function Logo({ size = 44, className, withWordmark = false, dark = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img
        src="/assets/brand/daily-fade-logo.png"
        alt="Daily Fade Barbershop"
        width={size}
        height={size}
        style={{ height: size, width: size }}
        className="shrink-0 object-contain"
      />
      {withWordmark && (
        <span className="hidden flex-col leading-none sm:flex">
          <span className={cn('font-display text-xl tracking-tight', dark ? 'text-bone' : 'text-ink')}>
            Daily <span className="text-gold">Fade</span>
          </span>
          {/*
            Tagline: was text-bone-soft/70 (dark) / text-ink-faint (light) —
            low-opacity gray on both variants, easy to miss. Bumped to full
            opacity + bold so it reads clearly on both the dark navbar and
            light auth-page contexts.
          */}
          <span
            className={cn(
              'mt-1 font-mono text-[9px] font-bold uppercase tracking-[0.28em]',
              dark ? 'text-bone' : 'text-ink'
            )}
          >
            Precision • Style • Confidence
          </span>
        </span>
      )}
    </span>
  )
}
