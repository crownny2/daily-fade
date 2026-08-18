<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'message' => $this->message,
            'is_read' => (bool) $this->is_read,
            'data' => $this->data ?? [],
            'notifiable_type' => $this->notifiable_type ? class_basename($this->notifiable_type) : null,
            'notifiable_id' => $this->notifiable_id,
            'created_at' => optional($this->created_at)->toIso8601String(),
        ];
    }
}
