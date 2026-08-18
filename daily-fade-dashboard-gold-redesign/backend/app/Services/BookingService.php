<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\BusinessSetting;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class BookingService
{
    public function __construct(private AvailabilityService $availability)
    {
    }

    /**
     * Steps (per spec):
     * 1. Validate customer (implicit - $customer is the authenticated user)
     * 2. Validate service
     * 3. Validate barber
     * 4. Validate date
     * 5. Validate schedule
     * 6. Calculate end time
     * 7. Check overlapping appointments
     * 8. Create appointment
     * 9. Create payment record
     */
    public function createAppointment(User $customer, array $data): Appointment
    {
        return DB::transaction(function () use ($customer, $data) {
            $settings = BusinessSetting::current();

            // 0. Online booking can be switched off from Admin Settings.
            if (!$settings->online_booking_enabled) {
                throw ValidationException::withMessages([
                    'online_booking' => ['Online booking is currently disabled. Please contact the shop directly.'],
                ]);
            }

            // 1b. Payment method must be one Admin Settings currently allows.
            // Settings > Payments has cash/gcash/maya toggles, but nothing
            // enforced them - a disabled method could still be booked.
            $method = $data['payment_method'] ?? 'cash';
            $methodEnabled = match ($method) {
                'cash' => $settings->payment_cash_enabled,
                'gcash' => $settings->payment_gcash_enabled,
                'maya' => $settings->payment_maya_enabled,
                default => false,
            };
            if (!$methodEnabled) {
                throw ValidationException::withMessages([
                    'payment_method' => ['This payment method is currently unavailable. Please choose another.'],
                ]);
            }

            // 2. Validate service
            $service = Service::where('is_active', true)->find($data['service_id']);
            if (!$service) {
                throw ValidationException::withMessages([
                    'service_id' => ['The selected service is invalid or unavailable.'],
                ]);
            }

            // 3. Validate barber
            $barber = Barber::where('is_active', true)->find($data['barber_id']);
            if (!$barber) {
                throw ValidationException::withMessages([
                    'barber_id' => ['The selected barber is invalid or unavailable.'],
                ]);
            }

            // 4. Validate date/time is not in the past
            $date = Carbon::parse($data['appointment_date']);
            $startTime = Carbon::parse($data['appointment_date'] . ' ' . $data['start_time']);

            if ($date->isBefore(Carbon::today())) {
                throw ValidationException::withMessages([
                    'appointment_date' => ['You cannot book a date in the past.'],
                ]);
            }

            if ($date->isToday() && $startTime->isBefore(Carbon::now())) {
                throw ValidationException::withMessages([
                    'start_time' => ['You cannot book a time in the past.'],
                ]);
            }

            // 4b. Minimum booking notice (Admin Settings > Booking Settings).
            if ($startTime->lt(Carbon::now()->addMinutes($settings->min_booking_notice_minutes))) {
                throw ValidationException::withMessages([
                    'start_time' => ["Bookings require at least {$settings->min_booking_notice_minutes} minutes notice."],
                ]);
            }

            // 4c. Maximum advance booking window (Admin Settings > Booking Settings).
            $latestBookableDate = Carbon::today()->addDays($settings->max_advance_booking_days);
            if ($date->gt($latestBookableDate)) {
                throw ValidationException::withMessages([
                    'appointment_date' => ["Bookings can only be made up to {$settings->max_advance_booking_days} days in advance."],
                ]);
            }

            // 4d. Shop-wide business hours (separate from each barber's individual
            // schedule below — both must allow the day for a booking to succeed).
            if (!$settings->isOpenOn($date->dayOfWeek)) {
                throw ValidationException::withMessages([
                    'appointment_date' => ['The shop is closed on this day.'],
                ]);
            }

            // 5. Validate schedule (day off / working hours)
            $schedule = $this->availability->scheduleFor($barber, $date);

            if (!$schedule) {
                throw ValidationException::withMessages([
                    'appointment_date' => ['No availability for this barber on this date.'],
                ]);
            }

            $scheduleStart = Carbon::parse($date->toDateString() . ' ' . $schedule->start_time);
            $scheduleEnd = Carbon::parse($date->toDateString() . ' ' . $schedule->end_time);

            // 6. Calculate end time from service duration - never trust a client-sent end_time
            $endTime = $startTime->copy()->addMinutes($service->duration_minutes);

            if ($startTime->lt($scheduleStart) || $endTime->gt($scheduleEnd)) {
                throw ValidationException::withMessages([
                    'start_time' => ["The selected time is outside the barber's working hours."],
                ]);
            }

            // 7. Check overlapping appointments (row-locked to prevent race conditions)
            $overlap = Appointment::where('barber_id', $barber->id)
                ->whereDate('appointment_date', $date->toDateString())
                ->whereIn('status', ['pending', 'confirmed', 'completed'])
                ->where('start_time', '<', $endTime->format('H:i:s'))
                ->where('end_time', '>', $startTime->format('H:i:s'))
                ->lockForUpdate()
                ->exists();

            if ($overlap) {
                throw ValidationException::withMessages([
                    'start_time' => ['This time slot is no longer available.'],
                ]);
            }

            // 8. Create appointment
            $appointment = Appointment::create([
                'booking_reference' => $this->generateBookingReference($date),
                'customer_id' => $customer->id,
                'barber_id' => $barber->id,
                'service_id' => $service->id,
                'appointment_date' => $date->toDateString(),
                'start_time' => $startTime->format('H:i:s'),
                'end_time' => $endTime->format('H:i:s'),
                'status' => $settings->default_appointment_status,
                'notes' => $data['notes'] ?? null,
            ]);

            // 9. Create payment record (Phase 7D-1: method now comes from the
            // customer's selection at booking time; no gateway integration
            // yet, so it always starts Pending regardless of method - GCash/
            // Maya are only confirmed later through Admin Payment Management,
            // same as Cash).
            Payment::create([
                'appointment_id' => $appointment->id,
                'amount' => $service->price,
                'method' => $data['payment_method'] ?? 'cash',
                'status' => 'pending',
            ]);

            return $appointment->fresh(['barber.user', 'service', 'payment']);
        });
    }

    private function generateBookingReference(Carbon $date): string
    {
        $prefix = 'BRB-' . $date->format('Ymd') . '-';

        // PostgreSQL doesn't allow FOR UPDATE combined with aggregate functions
        // (COUNT, SUM, etc.) since there are no individual rows to lock on an
        // aggregate result. Fetch and lock the actual rows instead, then count
        // them in PHP - still safe because this runs inside the same
        // DB::transaction() as the rest of createAppointment().
        $sequence = Appointment::whereDate('created_at', Carbon::today())->lockForUpdate()->get()->count();

        do {
            $sequence++;
            $reference = $prefix . str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
        } while (Appointment::where('booking_reference', $reference)->exists());

        return $reference;
    }
}
