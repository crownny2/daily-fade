<?php

namespace Database\Seeders;

use App\Models\BusinessSetting;
use Illuminate\Database\Seeder;

class BusinessSettingSeeder extends Seeder
{
    public function run(): void
    {
        BusinessSetting::create([
            'business_name' => 'Kuya Boy Barbershop',
            'phone' => '+63 917 123 4567',
            'email' => 'hello@kuyaboybarbershop.test',
            'address' => '123 Katipunan Avenue, Quezon City, Metro Manila',
            'website' => null,
            'timezone' => 'Asia/Manila',
            'currency' => 'PHP',
            'business_hours' => BusinessSetting::defaultBusinessHours(),
            'min_booking_notice_minutes' => 30,
            'max_advance_booking_days' => 30,
            'online_booking_enabled' => true,
            'default_appointment_status' => 'pending',
            'payment_cash_enabled' => true,
            'payment_gcash_enabled' => true,
            'payment_maya_enabled' => true,
        ]);
    }
}
