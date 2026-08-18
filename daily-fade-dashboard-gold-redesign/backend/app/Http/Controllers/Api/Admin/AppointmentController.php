<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $query = Appointment::with(['customer', 'barber.user', 'service', 'payment']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('booking_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->string('date'));
        }

        if ($request->filled('barber_id')) {
            $query->where('barber_id', $request->integer('barber_id'));
        }

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->integer('service_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        $appointments = $query
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->paginate($request->integer('per_page', 15));

        return AppointmentResource::collection($appointments)
            ->additional(['success' => true]);
    }

    public function updateStatus(Request $request, Appointment $appointment)
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['confirmed', 'completed', 'cancelled', 'no_show'])],
        ]);

        // Same guard Customer::cancel() and Barber::updateStatus() already
        // enforce: once an appointment reaches a terminal state, it can't
        // be moved to another status through this endpoint. Without this,
        // an admin could reopen a cancelled slot to 'confirmed' after it
        // had already been freed and possibly rebooked by someone else -
        // silently creating a double-booking with no overlap re-check.
        if (in_array($appointment->status, ['completed', 'cancelled', 'no_show'], true)) {
            return response()->json([
                'success' => false,
                'message' => "This appointment cannot be updated because it is already {$appointment->status}.",
            ], 422);
        }

        $appointment->update(['status' => $validated['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Appointment status updated.',
            'data' => new AppointmentResource(
                $appointment->fresh(['customer', 'barber.user', 'service', 'payment'])
            ),
        ]);
    }
}
