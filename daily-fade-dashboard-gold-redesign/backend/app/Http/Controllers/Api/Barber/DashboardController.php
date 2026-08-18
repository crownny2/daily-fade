<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Carbon\Carbon;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $barber = $request->user()->barber;

        if (! $barber) {
            return response()->json([
                'success' => false,
                'message' => 'No barber profile is linked to this account.',
            ], 404);
        }

        $today = Carbon::today();

        $base = Appointment::where('barber_id', $barber->id);

        return response()->json([
            'success' => true,
            'data' => [
                'today_appointments_count' => (clone $base)->whereDate('appointment_date', $today)->count(),
                'upcoming_appointments_count' => (clone $base)
                    ->whereDate('appointment_date', '>', $today)
                    ->whereIn('status', ['pending', 'confirmed'])
                    ->count(),
                'pending_appointments' => (clone $base)->where('status', 'pending')->count(),
                'confirmed_appointments' => (clone $base)->where('status', 'confirmed')->count(),
                'completed_appointments' => (clone $base)->where('status', 'completed')->count(),

                'todays_appointments' => AppointmentResource::collection(
                    (clone $base)
                        ->whereDate('appointment_date', $today)
                        ->with(['customer', 'barber.user', 'service', 'payment'])
                        ->orderBy('start_time')
                        ->get()
                ),

                'upcoming_appointments' => AppointmentResource::collection(
                    (clone $base)
                        ->whereDate('appointment_date', '>', $today)
                        ->whereIn('status', ['pending', 'confirmed'])
                        ->with(['customer', 'barber.user', 'service', 'payment'])
                        ->orderBy('appointment_date')
                        ->orderBy('start_time')
                        ->limit(10)
                        ->get()
                ),
            ],
        ]);
    }
}
