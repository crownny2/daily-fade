import { Scissors, Sparkles, Droplets, Palette, Baby, Users, type LucideIcon } from 'lucide-react'

/**
 * Maps a service name to a representative icon for the booking flow's
 * "Select a Service" cards. Matching is case-insensitive and keyword based
 * so new services still get a sensible icon instead of nothing.
 */
export function serviceIcon(name: string): LucideIcon {
  const key = name.toLowerCase()
  if (key.includes('combo')) return Users
  if (key.includes('beard') || key.includes('shave')) return Sparkles
  if (key.includes('spa')) return Droplets
  if (key.includes('color')) return Palette
  if (key.includes('kid')) return Baby
  return Scissors
}
