import { Link } from 'react-router-dom'
import { MapPin, Clock, Phone } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'

export function Footer() {
  return (
    <footer className="border-t border-gold-soft bg-noir text-bone">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo size={52} />
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-gold/70">
            Precision • Style • Confidence
          </p>
          <p className="mt-4 max-w-xs text-sm text-bone-soft">
            Precision cuts, clean fades, and timeless style booked online in minutes, delivered
            in the chair every time.
          </p>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gold/60">Explore</p>
          <ul className="mt-4 space-y-2 text-sm text-bone-soft">
            <li><Link to="/services" className="transition-colors hover:text-gold-bright">Services</Link></li>
            <li><Link to="/barbers" className="transition-colors hover:text-gold-bright">Barbers</Link></li>
            <li><Link to="/book" className="transition-colors hover:text-gold-bright">Book Appointment</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-gold/60">Visit Us</p>
          <ul className="mt-4 space-y-2.5 text-sm text-bone-soft">
            <li className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-gold" />
              Davao City, Philippines
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-gold" />
              Mon–Sat, 9:00 AM – 6:00 PM
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-gold" />
              +63 917 000 0000
            </li>
          </ul>
        </div>
      </div>

      <div className="divider-gold opacity-40" />

      <div className="px-6 py-5 text-center font-mono text-xs text-bone-soft/50">
        © {new Date().getFullYear()} Daily Fade. All rights reserved.
      </div>
    </footer>
  )
}
