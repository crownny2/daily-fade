<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentAccessTest extends TestCase
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

    private function makeBarber(): Barber
    {
        $user = User::create([
            'name' => 'Test Barber',
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

    private function makeAppointment(User $customer, Barber $barber, Service $service, string $status = 'pending'): Appointment
    {
        return Appointment::create([
            'booking_reference' => 'BRB-TEST-' . random_int(1000, 9999),
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => $status,
        ]);
    }

    public function test_customer_can_view_own_appointments(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarber();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/my-appointments')
            ->assertStatus(200)
            ->assertJsonPath('data.0.id', $appointment->id);

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/my-appointments/{$appointment->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.id', $appointment->id);
    }

    public function test_customer_cannot_view_another_customers_appointment(): void
    {
        $owner = $this->makeCustomer();
        $intruder = $this->makeCustomer();
        $barber = $this->makeBarber();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($owner, $barber, $service);

        $this->actingAs($intruder, 'sanctum')
            ->getJson("/api/my-appointments/{$appointment->id}")
            ->assertStatus(403);
    }

    public function test_customer_can_cancel_eligible_appointment(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarber();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'pending');

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/my-appointments/{$appointment->id}/cancel")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'cancelled',
        ]);
    }

    public function test_completed_appointment_cannot_be_cancelled(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarber();
        $service = $this->makeService();
        $appointment = $this->makeAppointment($customer, $barber, $service, 'completed');

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/my-appointments/{$appointment->id}/cancel")
            ->assertStatus(422);

        $this->assertDatabaseHas('appointments', [
            'id' => $appointment->id,
            'status' => 'completed',
        ]);
    }
}
