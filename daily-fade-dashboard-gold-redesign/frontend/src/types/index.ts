import type { PaymentMethod, PaymentStatus } from './admin'

export type Role = 'admin' | 'barber' | 'customer'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
}

export interface Service {
  id: number
  name: string
  description: string | null
  duration_minutes: number
  price: string | number
  is_active?: boolean
}

export interface Barber {
  id: number
  name: string
  specialty: string | null
  bio: string | null
}

export type AppointmentStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show'

export interface Appointment {
  id: number
  booking_reference: string
  status: AppointmentStatus
  appointment_date: string
  start_time: string
  end_time: string
  notes: string | null
  customer?: { id: number; name: string }
  barber?: { id: number; name: string | null }
  service?: {
    id: number
    name: string
    duration_minutes: number
    price: string | number
  }
  payment?: {
    amount: string | number
    method: PaymentMethod
    status: PaymentStatus
    transaction_reference?: string | null
    paid_at?: string | null
  } | null
  created_at?: string
}

export interface AvailabilitySlot {
  start_time: string
  end_time: string
  available: boolean
}

export interface Availability {
  date: string
  barber: { id: number; name: string | null }
  service: { id: number; name: string }
  duration: number
  slots: AvailabilitySlot[]
  message?: string
}

/** Envelope used by most API endpoints: { success, data } or { success, message }. */
export interface ApiEnvelope<T> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedData<T> {
  data: T[]
  links?: unknown
  meta?: { current_page: number; last_page: number; total: number }
}

export interface BookingDraft {
  service: Service | null
  barber: Barber | null
  date: string | null
  slot: AvailabilitySlot | null
  notes: string
  paymentMethod: PaymentMethod
  contactName: string
  contactEmail: string
  contactPhone: string
}

export type { PaymentMethod, PaymentStatus }
