<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::where('role', User::ROLE_CUSTOMER)->get();
        $barbers = Barber::all();
        $services = Service::all();

        if ($customers->isEmpty() || $barbers->isEmpty() || $services->isEmpty()) {
            $this->command?->warn('Skipping AppointmentSeeder: missing customers, barbers, or services.');

            return;
        }

        // Safe to re-run: clear previously seeded demo appointments/payments first.
        Payment::query()->delete();
        Appointment::query()->delete();

        $plan = [
            ['status' => 'completed', 'offsetDays' => 3, 'time' => '10:00'],
            ['status' => 'completed', 'offsetDays' => 2, 'time' => '11:00'],
            ['status' => 'cancelled', 'offsetDays' => 1, 'time' => '09:00'],
            ['status' => 'confirmed', 'offsetDays' => -1, 'time' => '10:00'],
            ['status' => 'confirmed', 'offsetDays' => -2, 'time' => '13:00'],
            ['status' => 'pending', 'offsetDays' => -3, 'time' => '14:00'],
            ['status' => 'pending', 'offsetDays' => -4, 'time' => '15:00'],
        ];

        foreach ($plan as $i => $entry) {
            $barber = $barbers[$i % $barbers->count()];
            $service = $services[$i % $services->count()];
            $customer = $customers[$i % $customers->count()];

            $date = Carbon::today()->subDays($entry['offsetDays']);
            $start = Carbon::parse($date->toDateString() . ' ' . $entry['time']);
            $end = $start->copy()->addMinutes($service->duration_minutes);

            $appointment = Appointment::create([
                'booking_reference' => 'BRB-' . $date->format('Ymd') . '-' . str_pad((string) ($i + 1), 4, '0', STR_PAD_LEFT),
                'customer_id' => $customer->id,
                'barber_id' => $barber->id,
                'service_id' => $service->id,
                'appointment_date' => $date->toDateString(),
                'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s'),
                'status' => $entry['status'],
                'notes' => null,
            ]);

            Payment::create([
                'appointment_id' => $appointment->id,
                'amount' => $service->price,
                'method' => 'cash',
                'status' => $entry['status'] === 'completed' ? 'paid' : 'pending',
                'paid_at' => $entry['status'] === 'completed' ? $end : null,
            ]);
        }
    }
}