<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;

    // Appointment-related
    public const TYPE_APPOINTMENT_NEW = 'appointment_new';
    public const TYPE_APPOINTMENT_CONFIRMED = 'appointment_confirmed';
    public const TYPE_APPOINTMENT_CANCELLED = 'appointment_cancelled';
    public const TYPE_APPOINTMENT_COMPLETED = 'appointment_completed';
    public const TYPE_APPOINTMENT_NO_SHOW = 'appointment_no_show';

    // Payment-related
    public const TYPE_PAYMENT_PENDING = 'payment_pending';
    public const TYPE_PAYMENT_PAID = 'payment_paid';
    public const TYPE_PAYMENT_FAILED = 'payment_failed';
    public const TYPE_PAYMENT_REFUNDED = 'payment_refunded';

    // Customer-related
    public const TYPE_CUSTOMER_NEW = 'customer_new';

    // Barber-related
    public const TYPE_SCHEDULE_UPDATED = 'schedule_updated';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'is_read',
        'notifiable_id',
        'notifiable_type',
    ];

    protected function casts(): array
    {
        return [
            'is_read' => 'boolean',
            'data' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable()
    {
        return $this->morphTo();
    }
}
