<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7C-1 — Barber Core (dashboard, own appointments, status updates).
 */
class BarberPortalTest extends TestCase
{
    use RefreshDatabase;

    private function makeCustomer(): User
    {
        return User::create([
            'name' => 'Test Customer',
            'email' => uniqid('customer_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_CUSTOMER,
        ]);
    }

    private function makeBarber(string $name = 'Test Barber'): Barber
    {
        $user = User::create([
            'name' => $name,
            'email' => uniqid('barber_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_BARBER,
        ]);

        return Barber::create(['user_id' => $user->id, 'is_active' => true]);
    }

    private function makeService(): Service
    {
        return Service::create([
            'name' => 'Test Service',
            'duration_minutes' => 30,
            'price' => 150,
            'is_active' => true,
        ]);
    }

    private function makeAppointment(
        User $customer,
        Barber $barber,
        Service $service,
        string $status = 'pending',
        ?Carbon $date = null
    ): Appointment {
        return Appointment::create([
            'booking_reference' => 'BRB-BARBER-' . random_int(10000, 99999),
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => ($date ?? Carbon::tomorrow())->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => $status,
        ]);
    }

    // ---------------------------------------------------------------
    // Dashboard
    // ---------------------------------------------------------------

    public function test_barber_dashboard_loads_and_is_scoped_to_own_appointments(): void
    {
        $barber1 = $this->makeBarber('Barber One');
        $barber2 = $this->makeBarber('Barber Two');
        $customer = $this->makeCustomer();
        $service = $this->makeService();

        $this->makeAppointment($customer, $barber1, $service, 'pending', Carbon::today());
        $this->makeAppointment($customer, $barber1, $service, 'confirmed', Carbon::today()->addDays(2));
        // Belongs to a different barber - must not be counted for barber1.
        $this->makeAppointment($customer, $barber2, $service, 'pending', Carbon::today());

        $response = $this->actingAs($barber1->user, 'sanctum')->getJson('/api/barber/dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('data.today_appointments_count', 1)
            ->assertJsonPath('data.upcoming_appointments_count', 1)
            ->assertJsonPath('data.pending_appointments', 1)
            ->assertJsonPath('data.confirmed_appointments', 1);
    }

    public function test_customer_cannot_access_barber_dashboard(): void
    {
        $customer = $this->makeCustomer();

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/barber/dashboard')
            ->assertStatus(403);
    }

    public function test_admin_cannot_access_barber_dashboard(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/barber/dashboard')
            ->assertStatus(403);
    }

    public function test_guest_cannot_access_barber_dashboard(): void
    {
        $this->getJson('/api/barber/dashboard')->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // My Appointments (list) — barber isolation
    // ---------------------------------------------------------------

    public function test_barber_only_sees_own_appointments_in_list(): void
    {
        $barber1 = $this->makeBarber('Barber One');
        $barber2 = $this->makeBarber('Barber Two');
        $customer = $this->makeCustomer();
        $service = $this->makeService();

        $ownAppt = $this->makeAppointment($customer, $barber1, $service);
        $this->makeAppointment($customer, $barber2, $service);

        $response = $this->actingAs($barber1->user, 'sanctum')->getJson('/api/barber/appointments');

        $response->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('id')->all();

        $this->assertContains($ownAppt->id, $ids);
        $this->assertCount(1, $ids);
    }

    public function test_barber_appointments_list_supports_filters(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();

        $this->makeAppointment($customer, $barber, $service, 'pending', Carbon::tomorrow());
        $this->makeAppointment($customer, $barber, $service, 'confirmed', Carbon::tomorrow()->addDay());

        $response = $this->actingAs($barber->user, 'sanctum')
            ->getJson('/api/barber/appointments?status=confirmed');

        $response->assertStatus(200);
        $statuses = collect($response->json('data'))->pluck('status')->unique()->all();
        $this->assertEquals(['confirmed'], $statuses);
    }

    // ---------------------------------------------------------------
    // Appointment details — ownership enforced
    // ---------------------------------------------------------------

    public function test_barber_can_view_own_appointment_details(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service);

        Payment::create([
            'appointment_id' => $appointment->id,
            'amount' => 150,
            'method' => 'cash',
            'status' => 'pending',
        ]);

        $this->actingAs($barber->user, 'sanctum')
            ->getJson("/api/barber/appointments/{$appointment->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $appointment->id)
            ->assertJsonPath('data.payment.method', 'cash');
    }

    public function test_barber_cannot_view_another_barbers_appointment(): void
    {
        $barber1 = $this->makeBarber('Barber One');
        $barber2 = $this->makeBarber('Barber Two');
        $customer = $this->makeCustomer();
        $service = $this->makeService();

        $appointment = $this->makeAppointment($customer, $barber2, $service);

        $this->actingAs($barber1->user, 'sanctum')
            ->getJson("/api/barber/appointments/{$appointment->id}")
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // Status updates
    // ---------------------------------------------------------------

    public function test_barber_can_confirm_own_pending_appointment(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'pending');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'confirmed']);
    }

    public function test_barber_can_complete_a_confirmed_appointment(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'confirmed');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'completed'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'completed');
    }

    public function test_barber_can_mark_no_show(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'confirmed');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'no_show'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'no_show');
    }

    public function test_barber_can_cancel_own_appointment(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'pending');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'cancelled'])
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');
    }

    public function test_barber_cannot_update_status_of_already_completed_appointment(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'completed');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'cancelled'])
            ->assertStatus(422);
    }

    public function test_barber_cannot_update_status_of_another_barbers_appointment(): void
    {
        $barber1 = $this->makeBarber('Barber One');
        $barber2 = $this->makeBarber('Barber Two');
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber2, $service, 'pending');

        $this->actingAs($barber1->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertStatus(403);

        $this->assertDatabaseHas('appointments', ['id' => $appointment->id, 'status' => 'pending']);
    }

    public function test_barber_status_update_rejects_invalid_status(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'pending');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'made_up_status'])
            ->assertStatus(422);
    }

    // ---------------------------------------------------------------
    // Status change is visible to admin (regression: shared data source)
    // ---------------------------------------------------------------

    public function test_admin_sees_status_update_made_by_barber(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'pending');

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200);

        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin_' . uniqid() . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/appointments')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $appointment->id, 'status' => 'confirmed']);
    }

    // ---------------------------------------------------------------
    // Cross-role / unauthenticated security matrix
    // ---------------------------------------------------------------

    public function test_customer_cannot_access_barber_appointments_endpoints(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service);

        $this->actingAs($customer, 'sanctum')->getJson('/api/barber/appointments')->assertStatus(403);
        $this->actingAs($customer, 'sanctum')->getJson("/api/barber/appointments/{$appointment->id}")->assertStatus(403);
        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertStatus(403);
    }

    public function test_guest_cannot_access_barber_appointments_endpoints(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service);

        $this->getJson('/api/barber/appointments')->assertStatus(401);
        $this->getJson("/api/barber/appointments/{$appointment->id}")->assertStatus(401);
        $this->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'confirmed'])->assertStatus(401);
    }

    public function test_barber_cannot_access_admin_endpoints(): void
    {
        $barber = $this->makeBarber();

        foreach ([
            '/api/admin/dashboard',
            '/api/admin/appointments',
            '/api/admin/settings',
        ] as $endpoint) {
            $this->actingAs($barber->user, 'sanctum')
                ->getJson($endpoint)
                ->assertStatus(403, "Expected 403 from barber on {$endpoint}");
        }
    }
}
