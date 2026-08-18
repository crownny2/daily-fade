<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Barber extends Model
{
    use HasFactory;

    public const DAY_NAMES = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    protected $fillable = [
        'user_id',
        'specialty',
        'bio',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class);
    }

    public function schedules()
    {
        return $this->hasMany(BarberSchedule::class);
    }

    /**
     * Full Sunday-Saturday schedule for this barber. Days with no
     * BarberSchedule row are reported as a day off with sensible default
     * hours, so callers always get exactly 7 rows to render. Shared by
     * Api\Admin\BarberScheduleController (edit view) and
     * Api\Barber\ScheduleController (read-only self view) so there's one
     * source of truth for "what does a barber's week look like".
     */
    public function weeklySchedule(): array
    {
        $this->loadMissing('schedules');
        $scheduleByDay = $this->schedules->keyBy('day_of_week');

        return collect(range(0, 6))->map(function (int $day) use ($scheduleByDay) {
            $row = $scheduleByDay->get($day);

            return [
                'day_of_week' => $day,
                'day_name' => self::DAY_NAMES[$day],
                'is_available' => $row?->is_available ?? false,
                'start_time' => $row ? substr((string) $row->start_time, 0, 5) : '09:00',
                'end_time' => $row ? substr((string) $row->end_time, 0, 5) : '18:00',
            ];
        })->values()->all();
    }
}
