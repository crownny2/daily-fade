<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    /**
     * GET /api/barber/appointments
     * Scoped to the authenticated barber's own appointments only - never
     * trusts a barber_id from the request. Mirrors the filtering shape of
     * Api\Admin\AppointmentController::index() (search/status/date), minus
     * the barber_id filter, which is redundant here.
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

        $query = Appointment::where('barber_id', $barber->id)
            ->with(['customer', 'barber.user', 'service', 'payment']);

        if ($request->filled('search')) {
            $search = $request->string('search');
            $query->where(function ($q) use ($search) {
                $q->where('booking_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('appointment_date', $request->string('date'));
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

    /**
     * GET /api/barber/appointments/{appointment}
     * Ownership enforced by AppointmentPolicy::view() - same policy the
     * customer /my-appointments/{id} route already uses, extended to
     * cover barbers (see AppointmentPolicy). Returns 403 for another
     * barber's appointment, 404 if it doesn't exist.
     */
    public function show(Request $request, Appointment $appointment)
    {
        Gate::authorize('view', $appointment);

        return response()->json([
            'success' => true,
            'data' => new AppointmentResource(
                $appointment->load(['customer', 'barber.user', 'service', 'payment'])
            ),
        ]);
    }

    /**
     * PATCH /api/barber/appointments/{appointment}/status
     * Same allowed-status set as Api\Admin\AppointmentController::updateStatus
     * (no new status system). Unlike the admin endpoint, a barber cannot
     * touch an appointment that's already in a terminal state - matches the
     * same guard AppointmentController::cancel() already applies for
     * customers self-cancelling.
     */
    public function updateStatus(Request $request, Appointment $appointment)
    {
        Gate::authorize('view', $appointment);

        $validated = $request->validate([
            'status' => ['required', Rule::in(['confirmed', 'completed', 'cancelled', 'no_show'])],
        ]);

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
