<?php

namespace Database\Seeders;

use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class BarberSeeder extends Seeder
{
    public function run(): void
    {
        $barbers = [
            ['name' => 'Jayson Cruz', 'email' => 'jayson.cruz@barbershop.test', 'specialty' => 'Fades & Tapers'],
            ['name' => 'Mark Anthony Reyes', 'email' => 'markanthony.reyes@barbershop.test', 'specialty' => 'Classic Cuts'],
            ['name' => 'Ronnel Bautista', 'email' => 'ronnel.bautista@barbershop.test', 'specialty' => 'Beard Grooming'],
            ['name' => 'Jomari Santos', 'email' => 'jomari.santos@barbershop.test', 'specialty' => 'Hair Color'],
            ['name' => 'Kevin Garcia', 'email' => 'kevin.garcia@barbershop.test', 'specialty' => 'Kids Haircuts'],
            ['name' => 'Aldrin Mendoza', 'email' => 'aldrin.mendoza@barbershop.test', 'specialty' => 'Hot Towel Shave'],
        ];

        foreach ($barbers as $index => $data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => '+63 917 100 ' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                'password' => Hash::make('password'),
                'role' => User::ROLE_BARBER,
                'email_verified_at' => now(),
            ]);

            $barber = Barber::create([
                'user_id' => $user->id,
                'specialty' => $data['specialty'],
                'bio' => "Experienced barber specializing in {$data['specialty']}.",
                'is_active' => true,
            ]);

            // Monday (1) through Saturday (6): 9:00 AM - 6:00 PM. Sunday off.
            for ($day = 1; $day <= 6; $day++) {
                BarberSchedule::create([
                    'barber_id' => $barber->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'is_available' => true,
                ]);
            }
        }
    }
}
