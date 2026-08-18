<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory;

    public const ROLE_ADMIN = 'admin';
    public const ROLE_BARBER = 'barber';
    public const ROLE_CUSTOMER = 'customer';

    /**
     * Mass assignable attributes.
     * Note: 'role' is here for seeding/admin-management purposes only.
     * Public registration NEVER trusts a client-supplied role — see AuthController::register().
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'phone',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isBarber(): bool
    {
        return $this->role === self::ROLE_BARBER;
    }

    public function isCustomer(): bool
    {
        return $this->role === self::ROLE_CUSTOMER;
    }

    public function barber()
    {
        return $this->hasOne(Barber::class);
    }

    public function appointments()
    {
        return $this->hasMany(Appointment::class, 'customer_id');
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }
}
