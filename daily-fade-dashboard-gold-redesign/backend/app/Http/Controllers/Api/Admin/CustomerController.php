<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\CustomerResource;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Admin: list customers with aggregated booking stats (total
     * appointments, last appointment date, total spent) and optional
     * search by name / email / phone.
     */
    public function index(Request $request)
    {
        $query = User::query()
            ->where('role', User::ROLE_CUSTOMER)
            ->withCount('appointments')
            ->withMax('appointments', 'appointment_date')
            ->addSelect(['total_spent' => $this->totalSpentSubquery()]);

        if ($request->filled('search')) {
            $search = $request->string('search');

            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return CustomerResource::collection($customers)->additional(['success' => true]);
    }

    /**
     * Admin: view a single customer's profile plus full appointment
     * history (booking reference, service, barber, date/time, price,
     * appointment status, and payment status).
     */
    public function show(User $customer)
    {
        abort_unless($customer->role === User::ROLE_CUSTOMER, 404);

        $appointments = $customer->appointments()
            ->with(['barber.user', 'service', 'payment'])
            ->orderByDesc('appointment_date')
            ->orderByDesc('start_time')
            ->get();

        $totalSpent = $appointments->sum(
            fn ($appointment) => $appointment->payment && $appointment->payment->status === 'paid'
                ? (float) $appointment->payment->amount
                : 0
        );

        $lastAppointment = optional($appointments->first())->appointment_date?->toDateString();

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'email' => $customer->email,
                'phone' => $customer->phone,
                'total_appointments' => $appointments->count(),
                'last_appointment' => $lastAppointment,
                'total_spent' => (float) $totalSpent,
                'status' => CustomerResource::deriveStatus($lastAppointment),
                'created_at' => optional($customer->created_at)->toDateTimeString(),
                'appointments' => $appointments->map(fn ($appointment) => [
                    'id' => $appointment->id,
                    'booking_reference' => $appointment->booking_reference,
                    'service' => $appointment->service?->name,
                    'barber' => $appointment->barber?->user?->name,
                    'appointment_date' => $appointment->appointment_date?->toDateString(),
                    'start_time' => substr((string) $appointment->start_time, 0, 5),
                    'price' => (float) ($appointment->service?->price ?? 0),
                    'status' => $appointment->status,
                    'payment_status' => $appointment->payment?->status ?? 'pending',
                ]),
            ],
        ]);
    }

    /**
     * Correlated subquery: total amount paid across all of a customer's
     * appointments. Kept as a subquery (rather than withSum through a
     * relation) since "payments" only relates to users indirectly, via
     * appointments.
     */
    private function totalSpentSubquery()
    {
        return Payment::selectRaw('COALESCE(SUM(payments.amount), 0)')
            ->join('appointments', 'appointments.id', '=', 'payments.appointment_id')
            ->whereColumn('appointments.customer_id', 'users.id')
            ->where('payments.status', 'paid');
    }
}
