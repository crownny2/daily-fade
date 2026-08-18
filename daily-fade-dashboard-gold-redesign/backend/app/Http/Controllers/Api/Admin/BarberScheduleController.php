<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class BarberScheduleController extends Controller
{
    public function __construct(private NotificationService $notifications)
    {
    }

    /**
     * Admin: list all barbers with a full Sunday-Saturday schedule row for each.
     * Days with no BarberSchedule record are reported as a day off so the UI
     * always has exactly 7 rows per barber to render/edit.
     */
    public function index()
    {
        $barbers = Barber::with(['user', 'schedules'])->orderBy('id')->get();

        return response()->json([
            'success' => true,
            'data' => $barbers->map(fn (Barber $barber) => $this->formatBarber($barber)),
        ]);
    }

    /**
     * Admin: replace a single barber's full weekly schedule (7 days).
     *
     * Reuses the existing BarberSchedule model/table exactly as-is — this does
     * NOT introduce a second availability system. The existing
     * AvailabilityService::scheduleFor() reads from the same barber_schedules
     * table, keyed by (barber_id, day_of_week, is_available), so any change
     * made here is immediately reflected by GET /api/barbers/{barber}/availability.
     */
    public function update(Request $request, Barber $barber)
    {
        $validator = Validator::make($request->all(), [
            'schedule' => ['required', 'array', 'size:7'],
            'schedule.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'schedule.*.is_available' => ['required', 'boolean'],
            'schedule.*.start_time' => ['required', 'date_format:H:i'],
            'schedule.*.end_time' => ['required', 'date_format:H:i'],
        ]);

        $validator->after(function ($validator) use ($request) {
            foreach ($request->input('schedule', []) as $index => $day) {
                $isAvailable = $day['is_available'] ?? false;
                $start = $day['start_time'] ?? null;
                $end = $day['end_time'] ?? null;

                if ($isAvailable && $start !== null && $end !== null && $start >= $end) {
                    $validator->errors()->add("schedule.$index.end_time", 'End time must be after start time.');
                }
            }
        });

        $validated = $validator->validate();

        foreach ($validated['schedule'] as $day) {
            BarberSchedule::updateOrCreate(
                [
                    'barber_id' => $barber->id,
                    'day_of_week' => $day['day_of_week'],
                ],
                [
                    'start_time' => $day['start_time'],
                    'end_time' => $day['end_time'],
                    'is_available' => $day['is_available'],
                ]
            );
        }

        $this->notifications->barberScheduleUpdated($barber);

        return response()->json([
            'success' => true,
            'message' => 'Schedule updated.',
            'data' => $this->formatBarber($barber->fresh(['user', 'schedules'])),
        ]);
    }

    private function formatBarber(Barber $barber): array
    {
        return [
            'id' => $barber->id,
            'name' => $barber->user->name ?? null,
            'specialty' => $barber->specialty,
            'is_active' => $barber->is_active,
            'schedule' => $barber->weeklySchedule(),
        ];
    }
}
