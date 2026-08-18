<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Only authenticated customers may create appointments.
     * customer_id is NEVER read from the request body - it always
     * comes from the authenticated user (see BookingService).
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->isCustomer();
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'integer', 'exists:services,id'],
            'barber_id' => ['required', 'integer', 'exists:barbers,id'],
            'appointment_date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'date_format:H:i'],
            'notes' => ['nullable', 'string', 'max:500'],
            // Phase 7D-1: customer picks a payment method at booking time.
            // Optional for backward compatibility with any existing caller
            // that doesn't send it yet - BookingService falls back to 'cash'.
            'payment_method' => ['nullable', 'string', 'in:cash,gcash,maya'],
        ];
    }

    public function messages(): array
    {
        return [
            'appointment_date.date_format' => 'The appointment date must be in YYYY-MM-DD format.',
            'start_time.date_format' => 'The start time must be in HH:MM format.',
            'payment_method.in' => 'Payment method must be Cash, GCash, or Maya.',
        ];
    }
}
