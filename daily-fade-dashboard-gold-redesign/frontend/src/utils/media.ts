/**
 * Phase 7E-1A/B — presentational photo helpers.
 *
 * The Barber/Service API types (and the database behind them) don't carry a
 * photo field yet, and this pass is frontend-only, so we can't invent one on
 * the backend. Barbers still fall back to a deterministic placeholder face
 * per id. Services and the hero now use the client-supplied photos shipped
 * in /public/assets — matched by service name, since that's the only
 * stable, human-meaningful key the API gives us.
 *
 * Swap `barberPhoto`/`servicePhoto` for a real `photo_url` field the moment
 * the backend adds one — every call site already reads through these two
 * functions.
 */

const BARBER_FACE_POOL = [
  '/assets/barbers/barber-01.jpg',
  '/assets/barbers/barber-02.jpg',
  '/assets/barbers/barber-03.jpg',
  '/assets/barbers/barber-04.jpg',
  '/assets/barbers/barber-05.jpg',
  '/assets/barbers/barber-06.jpg',
]

export function barberPhoto(id: number): string {
  return BARBER_FACE_POOL[id % BARBER_FACE_POOL.length]
}

// Keyed by the exact service names seeded on the backend
// (backend/database/seeders/ServiceSeeder.php). Matching is case-insensitive
// and falls back to a generic haircut shot for any service name not listed
// here, so new services never render broken.
const SERVICE_IMAGE_BY_NAME: Record<string, string> = {
  'regular haircut': '/assets/services/regular-haircut.jpg',
  'signature haircut': '/assets/services/signature-haircut.jpg',
  'beard trim': '/assets/services/haircut-bread-trim.jpg',
  'hot towel shave': '/assets/services/hot-towel-shave.jpg',
  'hair color': '/assets/services/hair-color.jpg',
  'kids haircut': '/assets/services/kids-haircut.jpg',
  'hair spa': '/assets/services/hair-spa.jpg',
  'combo: haircut + beard trim': '/assets/services/signature-haircut.jpg',
}

const SERVICE_IMAGE_FALLBACK_POOL = [
  '/assets/services/regular-haircut.jpg',
  '/assets/services/signature-haircut.jpg',
  '/assets/services/hair-color.jpg',
  '/assets/services/hair-spa.jpg',
  '/assets/services/hot-towel-shave.jpg',
  '/assets/services/kids-haircut.jpg',
]

export function servicePhoto(id: number, name?: string): string {
  const key = name?.trim().toLowerCase()
  if (key && SERVICE_IMAGE_BY_NAME[key]) return SERVICE_IMAGE_BY_NAME[key]
  return SERVICE_IMAGE_FALLBACK_POOL[id % SERVICE_IMAGE_FALLBACK_POOL.length]
}

/**
 * Used as an <img onError> fallback when the primary servicePhoto() file is
 * missing/corrupted/fails to load, so a broken image renders as *something*
 * instead of a blank box. Always resolves to a fixed, known-good asset
 * (regular-haircut.jpg) rather than re-deriving from the same lookup table,
 * since the original pick may be the very file that just failed.
 */
export function servicePhotoFallback(_id: number): string {
  return '/assets/services/regular-haircut.jpg'
}

export const HERO_IMAGE_URL = '/assets/hero-barbershop.jpg'