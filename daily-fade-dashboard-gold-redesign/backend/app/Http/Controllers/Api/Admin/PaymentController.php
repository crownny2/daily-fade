<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\PaymentResource;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class PaymentController extends Controller
{
    private const RELATIONS = ['appointment.customer', 'appointment.barber.user', 'appointment.service'];

    /**
     * Admin: list payments with optional search (booking reference / customer
     * name) and status/method filters.
     */
    public function index(Request $request)
    {
        $query = Payment::with(self::RELATIONS);

        if ($request->filled('search')) {
            $search = $request->string('search');

            $query->whereHas('appointment', function ($q) use ($search) {
                $q->where('booking_reference', 'like', "%{$search}%")
                    ->orWhereHas('customer', fn($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status'));
        }

        if ($request->filled('method')) {
            $query->where('method', $request->string('method'));
        }

        $payments = $query
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 15));

        return PaymentResource::collection($payments)->additional(['success' => true]);
    }

    /**
     * Admin: view a single payment with full appointment context.
     */
    public function show(Payment $payment)
    {
        return response()->json([
            'success' => true,
            'data' => new PaymentResource($payment->load(self::RELATIONS)),
        ]);
    }

    /**
     * Admin: update a payment's status.
     *
     * - paid: requires a payment method (cash/gcash/maya), accepts an
     *   optional transaction reference (relevant for gcash/maya), and stamps
     *   paid_at with the current time.
     * - failed / refunded: status-only. This never touches real money - it
     *   only records what happened, per Phase 6F scope.
     */
    public function updateStatus(Request $request, Payment $payment)
    {
        // A cancelled appointment's payment is settled by the cancellation
        // flow itself (AppointmentObserver: paid -> refunded). Manually
        // reopening it here - e.g. marking it 'paid' again - would silently
        // re-inflate revenue on Dashboard/Reports for a booking that never
        // happened.
        if ($payment->appointment?->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'This payment belongs to a cancelled appointment and cannot be updated.',
            ], 422);
        }

        $rules = [
            'status' => ['required', Rule::in(['paid', 'failed', 'refunded'])],
            'notes' => ['nullable', 'string', 'max:500'],
        ];

        if ($request->input('status') === 'paid') {
            $rules['method'] = ['required', Rule::in(['cash', 'gcash', 'maya'])];
            $rules['transaction_reference'] = ['nullable', 'string', 'max:255'];
        }

        $validated = Validator::make($request->all(), $rules)->validate();

        $update = [
            'status' => $validated['status'],
        ];

        if (array_key_exists('notes', $validated)) {
            $update['notes'] = $validated['notes'];
        }

        if ($validated['status'] === 'paid') {
            $update['method'] = $validated['method'];
            $update['transaction_reference'] = $validated['transaction_reference'] ?? null;
            $update['paid_at'] = now();
        }

        $payment->update($update);

        return response()->json([
            'success' => true,
            'message' => match ($validated['status']) {
                'paid' => 'Payment marked as paid.',
                'failed' => 'Payment marked as failed.',
                'refunded' => 'Payment marked as refunded.',
            },
            'data' => new PaymentResource($payment->fresh(self::RELATIONS)),
        ]);
    }
}
