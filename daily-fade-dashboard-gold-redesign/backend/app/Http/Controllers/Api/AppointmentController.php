<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class AppointmentController extends Controller
{
    public function __construct(private BookingService $bookingService)
    {
    }

    public function store(StoreAppointmentRequest $request)
    {
        $appointment = $this->bookingService->createAppointment(
            $request->user(),
            $request->validated()
        );

        return response()->json([
            'success' => true,
            'message' => 'Appointment booked successfully.',
            'data' => new AppointmentResource($appointment),
        ], 201);
    }

    public function myAppointments(Request $request)
    {
        $appointments = $request->user()
            ->appointments()
            ->with(['barber.user', 'service', 'payment'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->paginate(15);

        return AppointmentResource::collection($appointments)
            ->additional(['success' => true]);
    }

    public function show(Request $request, Appointment $appointment)
    {
        Gate::authorize('view', $appointment);

        return response()->json([
            'success' => true,
            'data' => new AppointmentResource($appointment->load(['barber.user', 'service', 'payment'])),
        ]);
    }

    public function cancel(Request $request, Appointment $appointment)
    {
        // Ownership/visibility check (403/404 for other customers).
        Gate::authorize('view', $appointment);

        if (in_array($appointment->status, ['completed', 'cancelled', 'no_show'], true)) {
            return response()->json([
                'success' => false,
                'message' => "This appointment cannot be cancelled because it is already {$appointment->status}.",
            ], 422);
        }

        $appointment->update(['status' => 'cancelled']);

        return response()->json([
            'success' => true,
            'message' => 'Appointment cancelled.',
            'data' => new AppointmentResource($appointment->fresh(['barber.user', 'service', 'payment'])),
        ]);
    }
}