<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BarberResource extends JsonResource
{
    /**
     * Admin-only view of a barber: includes contact info (email/phone) and
     * account status pulled from the related User, plus appointment count
     * when it has been eager-loaded (loadCount('appointments')).
     */
    public function toArray(Request $request): array
    {
        $fullName = trim($this->user->name ?? '');
        $nameParts = $fullName === '' ? ['', ''] : explode(' ', $fullName, 2);

        return [
            'id' => $this->id,
            'name' => $this->user->name ?? null,
            'first_name' => $nameParts[0] ?? '',
            'last_name' => $nameParts[1] ?? '',
            'email' => $this->user->email ?? null,
            'phone' => $this->user->phone ?? null,
            'specialty' => $this->specialty,
            'bio' => $this->bio,
            'is_active' => (bool) $this->is_active,
            'status' => $this->is_active ? 'active' : 'inactive',
            'appointments_count' => $this->when(
                array_key_exists('appointments_count', $this->resource->getAttributes()),
                fn () => (int) $this->appointments_count
            ),
            'created_at' => optional($this->created_at)->toDateTimeString(),
        ];
    }
}
