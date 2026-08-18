import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Scissors,
  User,
  CalendarDays,
  Clock,
  Hourglass,
  Wallet,
  Banknote,
  Smartphone,
  CalendarPlus,
  ShieldCheck,
  Receipt,
} from 'lucide-react'
import { BookingStepper } from '@/components/booking/BookingStepper'
import { ServiceSelector } from '@/components/booking/ServiceSelector'
import { BarberSelector } from '@/components/booking/BarberSelector'
import { DateSelector } from '@/components/booking/DateSelector'
import { TimeSlotSelector } from '@/components/booking/TimeSlotSelector'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { createAppointment } from '@/api/appointments'
import { extractErrorMessage } from '@/api/client'
import { cn } from '@/utils/cn'
import { HERO_IMAGE_URL } from '@/utils/media'
import { formatCurrency, formatDateLong, formatDuration, formatTime, paymentMethodLabel } from '@/utils/format'
import type { BookingDraft, PaymentMethod } from '@/types'

const EMPTY_DRAFT: BookingDraft = {
  service: null,
  barber: null,
  date: null,
  slot: null,
  notes: '',
  paymentMethod: 'cash',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
}

const PAYMENT_METHODS: { value: PaymentMethod; description: string; icon: typeof Banknote }[] = [
  { value: 'cash', description: 'Pay in person at the shop', icon: Banknote },
  { value: 'gcash', description: 'Pay via GCash', icon: Smartphone },
  { value: 'maya', description: 'Pay via Maya', icon: Wallet },
]

const STEP_META: { eyebrow: string; title: string; description: string }[] = [
  { eyebrow: 'Choose a Service', title: 'What can we do for you?', description: 'All services are performed by skilled barbers using premium products.' },
  { eyebrow: 'Choose Your Barber', title: 'Meet Your Barber', description: 'Choose the barber who best matches your style and grooming needs.' },
  { eyebrow: 'Select a Date', title: 'Choose Your Date', description: 'Please select your preferred date for the appointment.' },
  { eyebrow: 'Select Your Time', title: 'Choose a Time', description: 'Select an available time for your appointment.' },
  { eyebrow: 'Almost There', title: 'Your Details', description: 'Please confirm your details and payment method.' },
  { eyebrow: 'Final Step', title: 'Review Your Booking', description: 'Please review your booking details before confirming your appointment.' },
]

const BACK_LABELS = ['', 'Back to Service', 'Back to Barber', 'Back to Date', 'Back to Time', 'Back to Details']
const CONTINUE_LABELS = ['Continue to Barber', 'Continue to Date', 'Continue to Time', 'Continue to Details', 'Continue to Review', '']

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scissors
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 border-b border-line py-3 last:border-b-0">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft/40 text-accent-dark">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>
      <div>
        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">{label}</p>
        <p className="text-sm font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

function ReviewRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scissors
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
      <dt className="flex items-center gap-3 text-sm text-ink-soft">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft/40 text-accent-dark">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  )
}

export function Booking() {
  const { isAuthenticated, user } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [draft, setDraft] = useState<BookingDraft>(EMPTY_DRAFT)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Bumped whenever a stale-slot error forces the availability list to refetch.
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0)

  // Pre-fill the editable contact fields from the signed-in account once,
  // without clobbering anything the customer has already typed.
  useEffect(() => {
    if (!user) return
    setDraft((d) => ({
      ...d,
      contactName: d.contactName || user.name,
      contactEmail: d.contactEmail || user.email,
      contactPhone: d.contactPhone || user.phone || '',
    }))
  }, [user])

  const canProceed = (() => {
    switch (step) {
      case 1: return draft.service !== null
      case 2: return draft.barber !== null
      case 3: return draft.date !== null
      case 4: return draft.slot !== null
      case 5: return draft.contactName.trim() !== '' && draft.contactEmail.trim() !== ''
      default: return true
    }
  })()

  const goNext = () => setStep((s) => Math.min(s + 1, 6))
  const goBack = () => setStep((s) => Math.max(s - 1, 1))

  const handleConfirm = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/book' } })
      return
    }
    if (!draft.service || !draft.barber || !draft.date || !draft.slot) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const appointment = await createAppointment({
        service_id: draft.service.id,
        barber_id: draft.barber.id,
        appointment_date: draft.date,
        start_time: draft.slot.start_time,
        notes: draft.notes || undefined,
        payment_method: draft.paymentMethod,
      })
      showToast('Appointment booked!', 'success')
      navigate('/booking/confirmation', { state: { appointment } })
    } catch (err) {
      const message = extractErrorMessage(err, 'Could not book this appointment. Please try another slot.')
      setSubmitError(message)

      // Stale availability (section 13): someone else took this slot between
      // when we loaded it and when we submitted. Don't trust the previously
      // loaded slot - drop it, force a fresh availability fetch, and send
      // the customer back to the time step to pick again.
      if (/no longer available|not available|outside the barber/i.test(message)) {
        setDraft((d) => ({ ...d, slot: null }))
        setAvailabilityRefreshKey((k) => k + 1)
        setStep(4)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const meta = STEP_META[step - 1]

  return (
    <div>
      {/* Dark premium band — carries the stepper across every step, same
          noir/gold surface language as the Landing hero. */}
      <section className="relative overflow-hidden px-6 py-12 text-bone">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-noir/80" aria-hidden="true" />
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl text-center">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">Book Your Appointment</p>
          <h1 className="mt-2 font-display text-3xl text-bone sm:text-4xl">
            {step === 1 && <>Select a <span className="text-gold-gradient">Service</span></>}
            {step === 2 && <>Select a <span className="text-gold-gradient">Barber</span></>}
            {step === 3 && <>Select a <span className="text-gold-gradient">Date</span></>}
            {step === 4 && <>Select a <span className="text-gold-gradient">Time</span></>}
            {step === 5 && <>Your <span className="text-gold-gradient">Details</span></>}
            {step === 6 && <>Review Your <span className="text-gold-gradient">Booking</span></>}
          </h1>
          <div className="mt-8">
            <BookingStepper currentStep={step} dark />
          </div>
        </div>
      </section>

      <div
        className={cn(
          'mx-auto px-6 py-12 sm:py-16',
          step === 3 || step === 5 || step === 6 ? 'max-w-5xl' : 'max-w-3xl'
        )}
      >
        <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">{meta.eyebrow}</p>
        <h2 className="mt-2 font-display text-2xl text-ink sm:text-3xl">{meta.title}</h2>
        <p className="mt-2 text-sm text-ink-soft">{meta.description}</p>

        <div className="mt-8 min-h-[280px]">
          {step === 1 && (
            <ServiceSelector
              selected={draft.service}
              // Changing the service changes its duration, so any previously
              // picked slot is no longer guaranteed to be valid - reset it.
              onSelect={(service) => setDraft((d) => ({ ...d, service, slot: null }))}
            />
          )}
          {step === 2 && (
            <BarberSelector
              selected={draft.barber}
              // Different barber = different schedule/availability entirely.
              onSelect={(barber) => setDraft((d) => ({ ...d, barber, slot: null }))}
            />
          )}

          {step === 3 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
              <DateSelector selected={draft.date} onSelect={(date) => setDraft((d) => ({ ...d, date, slot: null }))} />

              {/* Your Selections sidebar */}
              <aside className="flex flex-col gap-4">
                <Card className="p-5">
                  <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Your Selections</p>
                  <dl className="mt-3 space-y-3 text-sm">
                    <div className="border-b border-line pb-3">
                      <dt className="text-ink-faint">Service</dt>
                      <dd className="mt-0.5 font-display text-base text-ink">{draft.service?.name ?? '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-faint">Barber</dt>
                      <dd className="mt-0.5 font-display text-base text-ink">{draft.barber?.name ?? '—'}</dd>
                    </div>
                  </dl>
                </Card>
                <Card className="flex items-start gap-3 border-accent/30 bg-accent-soft/20 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft/60 text-accent-dark">
                    <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-sm text-ink">Choose a date</p>
                    <p className="mt-0.5 text-xs text-ink-soft">Select your preferred date to see available time slots.</p>
                  </div>
                </Card>
              </aside>
            </div>
          )}

          {step === 4 && draft.barber && draft.date && draft.service && (
            <TimeSlotSelector
              key={availabilityRefreshKey}
              barberId={draft.barber.id}
              date={draft.date}
              serviceId={draft.service.id}
              selected={draft.slot}
              onSelect={(slot) => setDraft((d) => ({ ...d, slot }))}
              onChangeDate={() => setStep(3)}
            />
          )}

          {step === 5 && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <div className="space-y-6">
                <Card className="p-5">
                  <p className="flex items-center gap-2 font-display text-lg text-ink">
                    <User className="h-4 w-4 text-accent-dark" strokeWidth={1.75} /> Personal Information
                  </p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Input
                      label="Full Name"
                      value={draft.contactName}
                      onChange={(e) => setDraft((d) => ({ ...d, contactName: e.target.value }))}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={draft.contactEmail}
                      onChange={(e) => setDraft((d) => ({ ...d, contactEmail: e.target.value }))}
                    />
                    <Input
                      label="Phone"
                      className="sm:col-span-2"
                      value={draft.contactPhone}
                      onChange={(e) => setDraft((d) => ({ ...d, contactPhone: e.target.value }))}
                    />
                  </div>
                </Card>

                <Card className="p-5">
                  <p className="font-display text-lg text-ink">Payment Method</p>
                  <div className="mt-4 grid grid-cols-3 gap-3">
                    {PAYMENT_METHODS.map((option) => {
                      const isSelected = draft.paymentMethod === option.value
                      return (
                        <button
                          key={option.value}
                          type="button"
                          aria-pressed={isSelected}
                          onClick={() => setDraft((d) => ({ ...d, paymentMethod: option.value }))}
                          className={cn(
                            'flex flex-col items-start gap-1.5 rounded-xl border p-3 text-left transition-colors cursor-pointer',
                            isSelected ? 'border-accent bg-accent-soft/30 shadow-gold' : 'border-line bg-canvas-raised hover:border-accent/50'
                          )}
                        >
                          <option.icon
                            className={cn('h-4 w-4', isSelected ? 'text-accent-dark' : 'text-ink-faint')}
                            strokeWidth={1.75}
                          />
                          <span className="font-display text-sm text-ink">{paymentMethodLabel(option.value)}</span>
                          <span className="text-xs text-ink-faint">{option.description}</span>
                        </button>
                      )
                    })}
                  </div>
                </Card>

                <Input
                  label="Anything your barber should know? (optional)"
                  placeholder="e.g. keep the sides tight, sensitive scalp…"
                  value={draft.notes}
                  onChange={(e) => setDraft((d) => ({ ...d, notes: e.target.value }))}
                />
                {!isAuthenticated && (
                  <p className="text-sm text-ink-soft">You'll need to sign in on the next step to confirm this booking.</p>
                )}
              </div>

              {/* Appointment Summary sidebar */}
              <aside className="flex flex-col gap-4">
                <Card className="p-5">
                  <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Appointment Summary</p>
                  <div className="mt-3">
                    {draft.service && <SummaryRow icon={Scissors} label="Service" value={draft.service.name} />}
                    {draft.barber && <SummaryRow icon={User} label="Barber" value={draft.barber.name} />}
                    {draft.date && <SummaryRow icon={CalendarDays} label="Date" value={formatDateLong(draft.date)} />}
                    {draft.slot && <SummaryRow icon={Clock} label="Time" value={formatTime(draft.slot.start_time)} />}
                  </div>
                  {draft.service && (
                    <div className="mt-3 flex items-center justify-between border-t border-line pt-3 text-sm">
                      <span className="text-ink-faint">Total Estimated Time</span>
                      <span className="font-medium text-ink">{formatDuration(draft.service.duration_minutes)}</span>
                    </div>
                  )}
                </Card>
                <Card className="flex items-start gap-3 border-accent/30 bg-accent-soft/20 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft/60 text-accent-dark">
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <p className="text-xs text-ink-soft">Your booking is safe and secure. We respect your privacy.</p>
                </Card>
              </aside>
            </div>
          )}

          {step === 6 && draft.service && draft.barber && draft.date && draft.slot && (
            <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
              <Card className="p-6">
                <dl>
                  <ReviewRow icon={Scissors} label="Service" value={draft.service.name} />
                  <ReviewRow icon={User} label="Barber" value={draft.barber.name} />
                  <ReviewRow icon={CalendarDays} label="Date" value={formatDateLong(draft.date)} />
                  <ReviewRow icon={Clock} label="Time" value={formatTime(draft.slot.start_time)} />
                  <ReviewRow icon={Hourglass} label="Duration" value={formatDuration(draft.service.duration_minutes)} />
                  <ReviewRow icon={Wallet} label="Payment Method" value={paymentMethodLabel(draft.paymentMethod)} />
                </dl>
                {submitError && <p className="mt-4 text-sm text-danger">{submitError}</p>}
              </Card>

              {/* Payment Summary sidebar */}
              <aside className="flex flex-col gap-4">
                <Card className="p-5">
                  <p className="flex items-center gap-2 font-display text-base text-ink">
                    <Receipt className="h-4 w-4 text-accent-dark" strokeWidth={1.75} /> Payment Summary
                  </p>
                  <p className="mt-0.5 text-xs text-ink-faint">
                    {draft.paymentMethod === 'cash' ? "You'll pay at the shop" : `You'll pay via ${paymentMethodLabel(draft.paymentMethod)}`}
                  </p>
                  <div className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Subtotal</span>
                      <span className="font-medium text-ink">{formatCurrency(draft.service.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-ink-soft">Convenience Fee</span>
                      <span className="font-medium text-ink">{formatCurrency(0)}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                    <span className="font-display text-base text-ink">Total</span>
                    <span className="font-mono text-xl font-medium text-accent-dark">{formatCurrency(draft.service.price)}</span>
                  </div>
                </Card>
                <Card className="flex items-start gap-3 border-accent/30 bg-accent-soft/20 p-5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft/60 text-accent-dark">
                    <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-sm text-ink">Secure Booking</p>
                    <p className="mt-0.5 text-xs text-ink-soft">Your booking is safe and confirmed after submission.</p>
                  </div>
                </Card>
              </aside>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex w-full items-center justify-between">
            <Button variant="ghost" onClick={goBack} disabled={step === 1}>
              {step === 1 ? 'Back' : BACK_LABELS[step - 1]}
            </Button>
            {step < 6 ? (
              <Button onClick={goNext} disabled={!canProceed}>
                {CONTINUE_LABELS[step - 1]}
              </Button>
            ) : (
              <Button onClick={handleConfirm} isLoading={isSubmitting}>
                {isAuthenticated ? 'Confirm Booking' : 'Sign In & Confirm'}
              </Button>
            )}
          </div>
          {step === 3 && (
            <p className="text-center text-xs text-ink-faint">You will be able to choose a time on the next step.</p>
          )}
          {step === 6 && (
            <p className="text-center text-xs text-ink-faint">By confirming, you agree to our booking terms.</p>
          )}
        </div>
      </div>
    </div>
  )
}
