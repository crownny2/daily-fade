<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 6A — Admin Dashboard Foundation.
 *
 * Covers what AdminDashboardTest.php does not: unauthenticated/non-admin
 * access to /api/admin/dashboard, and the new total_* fields the dashboard
 * cards rely on. Left as a separate file so the existing test suite is
 * never touched.
 */
class AdminDashboardFoundationTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(string $role): User
    {
        return User::create([
            'name' => ucfirst($role) . ' User',
            'email' => uniqid($role . '_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => $role,
        ]);
    }

    public function test_guest_cannot_access_admin_dashboard(): void
    {
        $this->getJson('/api/admin/dashboard')->assertStatus(401);
    }

    public function test_customer_cannot_access_admin_dashboard(): void
    {
        $customer = $this->makeUser(User::ROLE_CUSTOMER);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_barber_cannot_access_admin_dashboard(): void
    {
        $barberUser = $this->makeUser(User::ROLE_BARBER);
        Barber::create(['user_id' => $barberUser->id, 'is_active' => true]);

        $this->actingAs($barberUser, 'sanctum')
            ->getJson('/api/admin/dashboard')
            ->assertStatus(403);
    }

    public function test_admin_dashboard_includes_overall_totals(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);

        $customer = $this->makeUser(User::ROLE_CUSTOMER);

        $barberUser = $this->makeUser(User::ROLE_BARBER);
        $activeBarber = Barber::create(['user_id' => $barberUser->id, 'is_active' => true]);

        $inactiveBarberUser = $this->makeUser(User::ROLE_BARBER);
        Barber::create(['user_id' => $inactiveBarberUser->id, 'is_active' => false]);

        $activeService = Service::create([
            'name' => 'Active Service',
            'duration_minutes' => 30,
            'price' => 150,
            'is_active' => true,
        ]);

        Service::create([
            'name' => 'Inactive Service',
            'duration_minutes' => 30,
            'price' => 150,
            'is_active' => false,
        ]);

        Appointment::create([
            'booking_reference' => 'BRB-FOUND-0001',
            'customer_id' => $customer->id,
            'barber_id' => $activeBarber->id,
            'service_id' => $activeService->id,
            'appointment_date' => Carbon::yesterday()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => 'completed',
        ]);

        Appointment::create([
            'booking_reference' => 'BRB-FOUND-0002',
            'customer_id' => $customer->id,
            'barber_id' => $activeBarber->id,
            'service_id' => $activeService->id,
            'appointment_date' => Carbon::today()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'pending',
        ]);

        // total_* fields count everything regardless of status/active flag,
        // unlike active_barbers/active_services which are already covered
        // by AdminDashboardTest.php.
        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/admin/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.total_appointments', 2)
            ->assertJsonPath('data.total_barbers', 2)
            ->assertJsonPath('data.total_services', 2)
            ->assertJsonPath('data.active_barbers', 1)
            ->assertJsonPath('data.active_services', 1);
    }
}
