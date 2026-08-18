<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BarberResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->user->name ?? null,
            'specialty' => $this->specialty,
            'bio' => $this->bio,
        ];
    }
}
