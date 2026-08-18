import type { ReactNode } from 'react'
import { Logo } from '@/components/brand/Logo'

interface AuthSplitLayoutProps {
  children: ReactNode
}

/**
 * Shared shell for /login and /register.
 *
 * Desktop (lg+):  [ cinematic image 46% ] [ solid cream form panel, scrollable ]
 * Below lg:       the same barbershop photo goes full-bleed behind everything,
 *                  darkened for contrast, with the logo + auth card floating
 *                  on top — instead of dropping the image entirely.
 *
 * NOTE: The hero photo lives at `public/assets/background3.jpg`, so it's
 * referenced as a plain string path, NOT a JS import. Anything in `public/`
 * is served as-is by Vite at the root URL — importing it like a module
 * (from `@/assets/...`) is what caused the original "Failed to resolve
 * import" crash, since that resolver only looks inside `src/`.
 */

const heroBarbershop = '/assets/background3.jpg'

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="daily-fade-auth-shell relative flex min-h-[calc(100vh-84px)] w-full overflow-hidden bg-canvas">
      <style>{`
        .daily-fade-auth-shell .df-hero-word {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          letter-spacing: 0.4em;
        }
        .daily-fade-auth-shell .df-glow {
          pointer-events: none;
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          background: var(--color-accent-soft, #f2e2bf);
          opacity: 0.4;
        }
        .daily-fade-auth-shell .df-dot-grid {
          background-image: radial-gradient(var(--color-accent, #c9a24a) 1px, transparent 1px);
          background-size: 20px 20px;
          opacity: 0.12;
        }
        @media (prefers-reduced-motion: no-preference) {
          .daily-fade-auth-shell .df-hero-image {
            animation: df-hero-zoom 20s ease-in-out infinite alternate;
          }
        }
        @keyframes df-hero-zoom {
          from { transform: scale(1); }
          to { transform: scale(1.03); }
        }
      `}</style>

      {/* MOBILE / TABLET (< lg) — same photo, full-bleed behind the whole
          screen instead of being dropped. Darkened enough that the white
          card and dark navbar both read clearly on top of it. */}
      <div className="absolute inset-0 lg:hidden">
        <img
          src={heroBarbershop}
          alt=""
          className="df-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-noir/75 via-noir/60 to-noir/85" aria-hidden="true" />
      </div>

      {/* DESKTOP (lg+) — cinematic barbershop panel, left side of the split */}
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden lg:block">
        <img
          src={heroBarbershop}
          alt=""
          className="df-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(11,11,10,0.10) 0%, rgba(11,11,10,0.04) 88%, rgba(11,11,10,0) 95%, var(--color-canvas, #f5f0e6) 100%)',
          }}
        />
        <span className="df-hero-word absolute left-7 top-1/2 -translate-y-1/2 select-none font-display text-4xl font-semibold tracking-wide text-canvas/90 xl:text-5xl" />
      </div>

      {/* RIGHT / CONTENT — logo, eyebrow, and the auth card passed in as
          children. Transparent on mobile so the full-bleed photo behind it
          shows through; solid cream + texture once the desktop split kicks in. */}
      <div className="relative flex w-full flex-1 items-center justify-center overflow-y-auto px-6 py-14 lg:bg-canvas lg:px-16">
        {/* Subtle brand texture — desktop only, would be invisible over the photo anyway */}
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0 hidden opacity-[0.04] lg:block" aria-hidden="true" />
        <div aria-hidden className="df-glow -right-16 -top-10 hidden h-80 w-80 lg:block" />
        <div aria-hidden className="df-glow -bottom-20 -left-10 hidden h-72 w-72 lg:block" style={{ opacity: 0.25 }} />
        <div aria-hidden className="df-dot-grid pointer-events-none absolute bottom-0 right-0 hidden h-64 w-64 lg:block" />
        <div className="relative flex w-full max-w-md flex-col">
          <div className="flex flex-col items-center text-center animate-slide-up">
            <Logo size={64} />
            {/* text-bone on mobile (dark photo behind), text-ink on desktop (cream panel) */}
            <p className="mt-3 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-bone lg:text-ink">
              Precision • Style • Confidence
            </p>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
