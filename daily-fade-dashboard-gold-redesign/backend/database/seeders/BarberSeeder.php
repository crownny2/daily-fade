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

        $now = now();

        foreach ($barbers as $index => $data) {
            $user = User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'phone' => '+63 917 100 ' . str_pad((string) ($index + 1), 4, '0', STR_PAD_LEFT),
                    'password' => Hash::make('password'),
                    'role' => User::ROLE_BARBER,
                    'email_verified_at' => now(),
                ]
            );

            $barber = Barber::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialty' => $data['specialty'],
                    'bio' => "Experienced barber specializing in {$data['specialty']}.",
                    'is_active' => true,
                ]
            );

            // Reset this barber's weekly schedule and insert it in one bulk query.
            BarberSchedule::where('barber_id', $barber->id)->delete();

            $schedules = [];
            for ($day = 1; $day <= 6; $day++) {
                $schedules[] = [
                    'barber_id' => $barber->id,
                    'day_of_week' => $day,
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'is_available' => true,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }

            BarberSchedule::insert($schedules);
        }
    }
}