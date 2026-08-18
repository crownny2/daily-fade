<?php

namespace App\Services;

use App\Models\Barber;
use App\Models\BusinessSetting;
use App\Models\Service;
use Carbon\Carbon;

class AvailabilityService
{
    /**
     * Build the list of bookable slots for a barber/date/service combo.
     * Returns null when the barber has no active schedule for that day
     * (i.e. it's their day off).
     */
    public function getSlotsForDate(Barber $barber, Carbon $date, Service $service): ?array
    {
        $schedule = $this->scheduleFor($barber, $date);

        if (! $schedule) {
            return null;
        }

        $settings = BusinessSetting::current();
        $duration = $service->duration_minutes;

        $slotStart = Carbon::parse($date->toDateString() . ' ' . $schedule->start_time);
        $scheduleEnd = Carbon::parse($date->toDateString() . ' ' . $schedule->end_time);

        $existingAppointments = $barber->appointments()
            ->whereDate('appointment_date', $date->toDateString())
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->get(['start_time', 'end_time']);

        // Same cutoff BookingService enforces (Admin Settings > Booking
        // Settings > minimum notice). Comparing against this instead of
        // bare "now" keeps a slot from showing as available here only to
        // be rejected a moment later at confirm time.
        $earliestBookable = Carbon::now()->addMinutes($settings->min_booking_notice_minutes);
        $slots = [];

        while (true) {
            $slotEnd = $slotStart->copy()->addMinutes($duration);

            // Only generate a slot if the whole service fits inside the schedule.
            if ($slotEnd->gt($scheduleEnd)) {
                break;
            }

            $available = ! $slotStart->lt($earliestBookable);

            if ($available) {
                foreach ($existingAppointments as $appt) {
                    $apptStart = Carbon::parse($date->toDateString() . ' ' . $appt->start_time);
                    $apptEnd = Carbon::parse($date->toDateString() . ' ' . $appt->end_time);

                    if ($slotStart->lt($apptEnd) && $slotEnd->gt($apptStart)) {
                        $available = false;
                        break;
                    }
                }
            }

            $slots[] = [
                'start_time' => $slotStart->format('H:i'),
                'end_time' => $slotEnd->format('H:i'),
                'available' => $available,
            ];

            $slotStart = $slotEnd;
        }

        return $slots;
    }

    public function hasScheduleForDate(Barber $barber, Carbon $date): bool
    {
        return $this->scheduleFor($barber, $date) !== null;
    }

    public function scheduleFor(Barber $barber, Carbon $date)
    {
        return $barber->schedules()
            ->where('day_of_week', $date->dayOfWeek) // Carbon: 0 = Sunday ... 6 = Saturday
            ->where('is_available', true)
            ->first();
    }
}
