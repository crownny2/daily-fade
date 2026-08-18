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

        foreach ($customers as $index => $data) {
            User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => '+63 918 200 ' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'password' => Hash::make('password'),
                'role' => User::ROLE_CUSTOMER,
                'email_verified_at' => now(),
            ]);
        }
    }
}
