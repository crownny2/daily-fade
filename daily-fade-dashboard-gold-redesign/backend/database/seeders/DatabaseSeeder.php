<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            BusinessSettingSeeder::class,
            ServiceSeeder::class,
            AdminSeeder::class,
            BarberSeeder::class,
            CustomerSeeder::class,
            AppointmentSeeder::class,
        ]);
    }
}