<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Appointment extends Model
{
    use HasFactory;

    protected $fillable = [
        'booking_reference',
        'customer_id',
        'barber_id',
        'service_id',
        'appointment_date',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'appointment_date' => 'date',
        ];
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function barber()
    {
        return $this->belongsTo(Barber::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }
}
