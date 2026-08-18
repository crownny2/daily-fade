<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        DB::transaction(function () {
            $this->call([
                BusinessSettingSeeder::class,
                ServiceSeeder::class,
                AdminSeeder::class,
                BarberSeeder::class,
                CustomerSeeder::class,
                AppointmentSeeder::class,
            ]);
        });
    }
}