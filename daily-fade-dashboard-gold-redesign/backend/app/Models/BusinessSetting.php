<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BusinessSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_name',
        'phone',
        'email',
        'address',
        'website',
        'timezone',
        'currency',
        'business_hours',
        'min_booking_notice_minutes',
        'max_advance_booking_days',
        'online_booking_enabled',
        'default_appointment_status',
        'payment_cash_enabled',
        'payment_gcash_enabled',
        'payment_maya_enabled',
    ];

    protected function casts(): array
    {
        return [
            'business_hours' => 'array',
            'online_booking_enabled' => 'boolean',
            'payment_cash_enabled' => 'boolean',
            'payment_gcash_enabled' => 'boolean',
            'payment_maya_enabled' => 'boolean',
            'min_booking_notice_minutes' => 'integer',
            'max_advance_booking_days' => 'integer',
        ];
    }

    private const DAY_NAMES = [
        0 => 'Sunday',
        1 => 'Monday',
        2 => 'Tuesday',
        3 => 'Wednesday',
        4 => 'Thursday',
        5 => 'Friday',
        6 => 'Saturday',
    ];

    /**
     * Business settings are a single row (shop-wide config, not per-user).
     * Every consumer — the Settings page, BookingService, AvailabilityService —
     * goes through this accessor instead of querying the table directly, so
     * there is always exactly one row and it always has sane defaults, even
     * on a fresh database that hasn't run BusinessSettingSeeder.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], [
            'business_name' => 'My Barbershop',
            'phone' => null,
            'email' => null,
            'address' => null,
            'website' => null,
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
            'business_hours' => static::defaultBusinessHours(),
            'min_booking_notice_minutes' => 30,
            'max_advance_booking_days' => 30,
            'online_booking_enabled' => true,
            'default_appointment_status' => 'pending',
            'payment_cash_enabled' => true,
            'payment_gcash_enabled' => true,
            'payment_maya_enabled' => true,
        ]);
    }

    public static function defaultBusinessHours(): array
    {
        return collect(range(0, 6))->map(fn (int $day) => [
            'day_of_week' => $day,
            'day_name' => self::DAY_NAMES[$day],
            'is_open' => $day !== 0, // shop closed Sundays by default
            'open_time' => '09:00',
            'close_time' => '19:00',
        ])->values()->all();
    }

    /**
     * Normalizes business_hours (which may be null/partial on older rows)
     * into a guaranteed full Sunday-Saturday array, so the frontend and
     * booking logic never have to guard against missing days.
     */
    public function normalizedBusinessHours(): array
    {
        $byDay = collect($this->business_hours ?? [])->keyBy('day_of_week');

        return collect(range(0, 6))->map(function (int $day) use ($byDay) {
            $row = $byDay->get($day);

            return [
                'day_of_week' => $day,
                'day_name' => self::DAY_NAMES[$day],
                'is_open' => $row['is_open'] ?? false,
                'open_time' => $row['open_time'] ?? '09:00',
                'close_time' => $row['close_time'] ?? '19:00',
            ];
        })->values()->all();
    }

    public function isOpenOn(int $dayOfWeek): bool
    {
        $byDay = collect($this->business_hours ?? [])->keyBy('day_of_week');
        $row = $byDay->get($dayOfWeek);

        // No configured row = treat as open, so this never blocks bookings
        // on a database that predates business_hours being set.
        return $row === null || (bool) ($row['is_open'] ?? false);
    }
}
