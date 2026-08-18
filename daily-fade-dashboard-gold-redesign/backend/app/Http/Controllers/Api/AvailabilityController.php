<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use App\Models\BusinessSetting;
use App\Models\Service;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function __construct(private AvailabilityService $availabilityService)
    {
    }

    public function index(Request $request, Barber $barber)
    {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
            'service_id' => ['required', 'integer', 'exists:services,id'],
        ]);

        $service = Service::where('is_active', true)->find($validated['service_id']);

        if (! $service) {
            return response()->json([
                'success' => false,
                'message' => 'The selected service is invalid or unavailable.',
            ], 422);
        }

        $date = Carbon::parse($validated['date']);

        if ($date->isBefore(Carbon::today())) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot check availability for a past date.',
            ], 422);
        }

        // Mirror the same shop-wide rules BookingService enforces at
        // confirm time (online booking toggle, business-hours day, and the
        // advance-booking window), so a slot never shows here as bookable
        // only to be rejected a moment later on POST /appointments.
        $settings = BusinessSetting::current();
        $message = null;

        if (! $settings->online_booking_enabled) {
            $slots = [];
            $message = 'Online booking is currently disabled. Please contact the shop directly.';
        } elseif (! $settings->isOpenOn($date->dayOfWeek)) {
            $slots = [];
            $message = 'The shop is closed on this day.';
        } elseif ($date->gt(Carbon::today()->addDays($settings->max_advance_booking_days))) {
            $slots = [];
            $message = "Bookings can only be made up to {$settings->max_advance_booking_days} days in advance.";
        } else {
            $slots = $this->availabilityService->getSlotsForDate($barber, $date, $service);
            if ($slots === null) {
                $slots = [];
                $message = 'No availability for this barber on this date.';
            }
        }

        $data = [
            'date' => $date->toDateString(),
            'barber' => [
                'id' => $barber->id,
                'name' => $barber->user->name ?? null,
            ],
            'service' => [
                'id' => $service->id,
                'name' => $service->name,
            ],
            'duration' => $service->duration_minutes,
            'slots' => $slots,
        ];

        if ($message !== null) {
            $data['message'] = $message;
        }

        return response()->json([
            'success' => true,
            'data' => $data,
        ]);
    }
}
