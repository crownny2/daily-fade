<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_dashboard_returns_correct_statistics(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_dash@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $customer = User::create([
            'name' => 'Dash Customer',
            'email' => 'dash_customer@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_CUSTOMER,
        ]);

        $barberUser = User::create([
            'name' => 'Dash Barber',
            'email' => 'dash_barber@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_BARBER,
        ]);
        $barber = Barber::create(['user_id' => $barberUser->id, 'is_active' => true]);

        $service = Service::create([
            'name' => 'Dash Service',
            'duration_minutes' => 30,
            'price' => 100,
            'is_active' => true,
        ]);

        Appointment::create([
            'booking_reference' => 'BRB-DASH-0001',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'pending',
        ]);

        Appointment::create([
            'booking_reference' => 'BRB-DASH-0002',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.today_appointments_count', 2)
            ->assertJsonPath('data.pending_appointments', 1)
            ->assertJsonPath('data.confirmed_appointments', 1)
            ->assertJsonPath('data.total_customers', 1)
            ->assertJsonPath('data.active_barbers', 1)
            ->assertJsonPath('data.active_services', 1);
    }
}
