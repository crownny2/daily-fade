<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomerResource extends JsonResource
{
    /**
     * Expects the resource to carry `appointments_count`, the
     * `appointments_max_appointment_date` withMax alias, and a `total_spent`
     * subquery select — all added by CustomerController::index().
     */
    public function toArray(Request $request): array
    {
        $lastAppointment = $this->appointments_max_appointment_date;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'total_appointments' => (int) ($this->appointments_count ?? 0),
            'last_appointment' => $lastAppointment,
            'total_spent' => (float) ($this->total_spent ?? 0),
            'status' => CustomerResource::deriveStatus($lastAppointment),
            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }

    /**
     * Simple activity-based status: no bookings yet = "new", a booking
     * within the last 90 days = "active", otherwise "inactive". There is no
     * dedicated status column on users, so this is derived rather than
     * stored.
     */
    public static function deriveStatus(?string $lastAppointment): string
    {
        if (! $lastAppointment) {
            return 'new';
        }

        return now()->diffInDays($lastAppointment) <= 90 ? 'active' : 'inactive';
    }
}
