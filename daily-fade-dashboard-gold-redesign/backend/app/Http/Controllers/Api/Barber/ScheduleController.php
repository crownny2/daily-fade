<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    /**
     * GET /api/barber/schedule
     * Read-only: the admin remains the only one who can edit a barber's
     * weekly schedule (Api\Admin\BarberScheduleController::update). This
     * reuses the exact same Barber::weeklySchedule() the admin edit screen
     * is built from, so what a barber sees here always matches what's
     * actually used by the availability/booking engine - no second
     * schedule system, no risk of the two drifting apart.
     */
    public function index(Request $request)
    {
        $barber = $request->user()->barber;

        if (! $barber) {
            return response()->json([
                'success' => false,
                'message' => 'No barber profile is linked to this account.',
            ], 404);
        }

        $barber->loadMissing('schedules');

        return response()->json([
            'success' => true,
            'data' => [
                'barber_id' => $barber->id,
                'schedule' => $barber->weeklySchedule(),
            ],
        ]);
    }
}
