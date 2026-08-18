<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        User::create([
            'name' => 'Admin User',
            'email' => 'admin@barbershop.test',
            'phone' => '+63 917 000 0000',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'email_verified_at' => now(),
        ]);
    }
}
