<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'booking_reference' => $this->booking_reference,
            'status' => $this->status,
            'appointment_date' => $this->appointment_date->toDateString(),
            'start_time' => substr((string) $this->start_time, 0, 5),
            'end_time' => substr((string) $this->end_time, 0, 5),
            'notes' => $this->notes,
            'customer' => $this->whenLoaded('customer', fn () => [
                'id' => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'barber' => $this->whenLoaded('barber', fn () => [
                'id' => $this->barber->id,
                'name' => $this->barber->user->name ?? null,
            ]),
            'service' => $this->whenLoaded('service', fn () => [
                'id' => $this->service->id,
                'name' => $this->service->name,
                'duration_minutes' => $this->service->duration_minutes,
                'price' => $this->service->price,
            ]),
            'payment' => $this->whenLoaded('payment', fn () => $this->payment ? [
                'amount' => $this->payment->amount,
                'method' => $this->payment->method,
                'status' => $this->payment->status,
                'transaction_reference' => $this->payment->transaction_reference,
                'paid_at' => optional($this->payment->paid_at)->toDateTimeString(),
            ] : null),
            'created_at' => $this->created_at,
        ];
    }
}
