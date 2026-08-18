<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppointmentBookingTest extends TestCase
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

    private function makeBarberWithSchedule(array $days = []): Barber
    {
        $user = User::create([
            'name' => 'Test Barber',
            'email' => uniqid('barber_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_BARBER,
        ]);

        $barber = Barber::create([
            'user_id' => $user->id,
            'is_active' => true,
        ]);

        // Default: open every weekday 09:00-18:00 except no explicit config for Sunday(0)/Wed(3).
        $defaultDays = $days ?: [1, 2, 4, 5, 6];

        foreach ($defaultDays as $day) {
            BarberSchedule::create([
                'barber_id' => $barber->id,
                'day_of_week' => $day,
                'start_time' => '09:00:00',
                'end_time' => '18:00:00',
                'is_available' => true,
            ]);
        }

        return $barber;
    }

    private function makeService(int $duration = 30, float $price = 200): Service
    {
        return Service::create([
            'name' => 'Test Service',
            'duration_minutes' => $duration,
            'price' => $price,
            'is_active' => true,
        ]);
    }

    /** Next date that falls on the given Carbon day-of-week (0=Sun..6=Sat). */
    private function nextDateFor(int $dayOfWeek): Carbon
    {
        $date = Carbon::today()->addDay();
        while ($date->dayOfWeek !== $dayOfWeek) {
            $date->addDay();
        }

        return $date;
    }

    public function test_customer_can_create_appointment(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(45);
        $date = $this->nextDateFor(1); // Monday

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
            'notes' => 'Please be quick',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.start_time', '10:00')
            ->assertJsonPath('data.end_time', '10:45')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('appointments', [
            'customer_id' => $customer->id,
            'start_time' => '10:00:00',
            'end_time' => '10:45:00',
        ]);

        $this->assertDatabaseHas('payments', [
            'appointment_id' => $response->json('data.id'),
            'status' => 'pending',
        ]);
    }

    public function test_guest_cannot_create_appointment(): void
    {
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $response = $this->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(401);
    }

    public function test_customer_cannot_create_appointment_for_another_customer(): void
    {
        $customer = $this->makeCustomer();
        $otherCustomer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'customer_id' => $otherCustomer->id, // attempted spoof - must be ignored
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('appointments', [
            'customer_id' => $customer->id,
        ]);
        $this->assertDatabaseMissing('appointments', [
            'customer_id' => $otherCustomer->id,
        ]);
    }

    public function test_service_must_exist(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $date = $this->nextDateFor(1);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => 999,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(422);
    }

    public function test_barber_must_exist(): void
    {
        $customer = $this->makeCustomer();
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => 999,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(422);
    }

    public function test_cannot_book_past_date(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => Carbon::yesterday()->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('appointment_date');
    }

    public function test_cannot_book_on_barber_day_off(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule(); // no schedule row for Sunday(0) or Wednesday(3)
        $service = $this->makeService();
        $date = $this->nextDateFor(0); // Sunday - day off

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('appointment_date');
    }

    public function test_cannot_book_outside_barber_schedule(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule(); // 09:00-18:00 on Monday
        $service = $this->makeService(30);
        $date = $this->nextDateFor(1);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '17:50', // service would end 18:20, past 18:00 close
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('start_time');
    }

    public function test_service_duration_determines_end_time(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(60);
        $date = $this->nextDateFor(1);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
            'end_time' => '10:05', // spoof attempt - must be ignored
        ]);

        $response->assertStatus(201)->assertJsonPath('data.end_time', '11:00');
    }

    public function test_double_booking_is_rejected(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(45);
        $date = $this->nextDateFor(1);

        Appointment::create([
            'booking_reference' => 'BRB-TEST-0001',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:45:00',
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:15',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('start_time');
    }

    public function test_back_to_back_appointments_are_allowed(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(45);
        $date = $this->nextDateFor(1);

        Appointment::create([
            'booking_reference' => 'BRB-TEST-0002',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:45:00',
            'status' => 'confirmed',
        ]);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:45',
        ]);

        $response->assertStatus(201);
    }
}
