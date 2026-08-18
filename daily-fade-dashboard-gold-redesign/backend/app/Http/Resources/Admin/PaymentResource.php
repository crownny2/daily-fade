<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $appointment = $this->appointment;

        return [
            'id' => $this->id,
            'appointment_id' => $this->appointment_id,
            'booking_reference' => $appointment->booking_reference ?? null,
            'customer' => $appointment && $appointment->customer ? [
                'id' => $appointment->customer->id,
                'name' => $appointment->customer->name,
            ] : null,
            'barber' => $appointment && $appointment->barber ? [
                'id' => $appointment->barber->id,
                'name' => $appointment->barber->user->name ?? null,
            ] : null,
            'service' => $appointment && $appointment->service ? [
                'id' => $appointment->service->id,
                'name' => $appointment->service->name,
            ] : null,
            'appointment_date' => $appointment?->appointment_date?->toDateString(),
            'start_time' => $appointment ? substr((string) $appointment->start_time, 0, 5) : null,
            'appointment_status' => $appointment->status ?? null,
            'amount' => $this->amount,
            'method' => $this->method,
            'status' => $this->status,
            'transaction_reference' => $this->transaction_reference,
            'paid_at' => optional($this->paid_at)->toDateTimeString(),
            'notes' => $this->notes,
            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
