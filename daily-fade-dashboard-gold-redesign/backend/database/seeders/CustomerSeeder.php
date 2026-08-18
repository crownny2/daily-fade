<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CustomerSeeder extends Seeder
{
    public function run(): void
    {
        $customers = [
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@example.test'],
            ['name' => 'Maria Santos', 'email' => 'maria.santos@example.test'],
            ['name' => 'Jose Ramos', 'email' => 'jose.ramos@example.test'],
            ['name' => 'Andres Tan', 'email' => 'andres.tan@example.test'],
            ['name' => 'Grace Villanueva', 'email' => 'grace.villanueva@example.test'],
            ['name' => 'Angelica Torres', 'email' => 'angelica.torres@example.test'],
            ['name' => 'Paolo Fernandez', 'email' => 'paolo.fernandez@example.test'],
            ['name' => 'Bianca Aquino', 'email' => 'bianca.aquino@example.test'],
            ['name' => 'Miguel Lopez', 'email' => 'miguel.lopez@example.test'],
            ['name' => 'Samantha Navarro', 'email' => 'samantha.navarro@example.test'],
        ];

        $now = now();
        $password = Hash::make('password');

        foreach ($customers as $index => &$data) {
            $data['phone'] = '+63 918 200 ' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT);
            $data['password'] = $password;
            $data['role'] = User::ROLE_CUSTOMER;
            $data['email_verified_at'] = $now;
            $data['created_at'] = $now;
            $data['updated_at'] = $now;
        }
        unset($data);

        // ON CONFLICT (email) upsert — one query instead of 10 separate inserts.
        User::upsert(
            $customers,
            ['email'],
            ['name', 'phone', 'password', 'role', 'email_verified_at', 'updated_at']
        );
    }
}