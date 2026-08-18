<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateBusinessSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Route already sits behind ['auth:sanctum', 'role:admin'] — this is
        // just belt-and-suspenders in case the request class is ever reused.
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            // 1. Business Information
            'business_name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'phone' => ['nullable', 'string', 'max:20'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'website' => ['nullable', 'string', 'max:255'],

            // 2. Business Hours
            'business_hours' => ['required', 'array', 'size:7'],
            'business_hours.*.day_of_week' => ['required', 'integer', 'between:0,6', 'distinct'],
            'business_hours.*.is_open' => ['required', 'boolean'],
            'business_hours.*.open_time' => ['required', 'date_format:H:i'],
            'business_hours.*.close_time' => ['required', 'date_format:H:i'],

            // 3. Booking Settings
            'min_booking_notice_minutes' => ['required', 'integer', 'min:0', 'max:10080'],
            'max_advance_booking_days' => ['required', 'integer', 'min:1', 'max:365'],
            'online_booking_enabled' => ['required', 'boolean'],
            'default_appointment_status' => ['required', 'string', 'in:pending,confirmed'],

            // 4. Payment Settings
            'payment_cash_enabled' => ['required', 'boolean'],
            'payment_gcash_enabled' => ['required', 'boolean'],
            'payment_maya_enabled' => ['required', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            foreach ($this->input('business_hours', []) as $index => $day) {
                $isOpen = $day['is_open'] ?? false;
                $open = $day['open_time'] ?? null;
                $close = $day['close_time'] ?? null;

                if ($isOpen && $open !== null && $close !== null && $open >= $close) {
                    $validator->errors()->add("business_hours.$index.close_time", 'Closing time must be after opening time.');
                }
            }

            // At least one payment method must stay enabled, or customers
            // would have no way to pay for a booking.
            $anyPaymentEnabled = $this->boolean('payment_cash_enabled')
                || $this->boolean('payment_gcash_enabled')
                || $this->boolean('payment_maya_enabled');

            if (! $anyPaymentEnabled) {
                $validator->errors()->add('payment_cash_enabled', 'At least one payment method must be enabled.');
            }
        });
    }
}
