<?php

namespace Tests\Feature;

use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7D-1: Payment Integration.
 *
 * The payment method/status structure, the Admin Payments page, and the
 * Barber payment view already existed going into this phase (Phase 6F /
 * 7C-1). What's new here is letting the customer choose Cash/GCash/Maya at
 * booking time instead of the booking always defaulting to Cash - so these
 * tests focus on that seam plus the fields it touches.
 */
class PaymentIntegrationTest extends TestCase
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

    private function makeBarberWithSchedule(): Barber
    {
        $user = User::create([
            'name' => 'Test Barber',
            'email' => uniqid('barber_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_BARBER,
        ]);

        $barber = Barber::create(['user_id' => $user->id, 'is_active' => true]);

        foreach ([1, 2, 3, 4, 5] as $day) {
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

    private function makeService(float $price = 250): Service
    {
        return Service::create([
            'name' => 'Signature Haircut',
            'duration_minutes' => 30,
            'price' => $price,
            'is_active' => true,
        ]);
    }

    private function nextMonday(): Carbon
    {
        $date = Carbon::today()->addDay();
        while ($date->dayOfWeek !== 1) {
            $date->addDay();
        }

        return $date;
    }

    public function test_booking_without_payment_method_defaults_to_cash_pending(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment.method', 'cash')
            ->assertJsonPath('data.payment.status', 'pending');
    }

    public function test_customer_can_choose_gcash_at_booking(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(250);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
            'payment_method' => 'gcash',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment.method', 'gcash')
            // GCash is never auto-confirmed - no real gateway integration yet.
            ->assertJsonPath('data.payment.status', 'pending')
            ->assertJsonPath('data.payment.amount', '250.00');

        $this->assertDatabaseHas('payments', [
            'appointment_id' => $response->json('data.id'),
            'method' => 'gcash',
            'status' => 'pending',
            'amount' => 250,
        ]);
    }

    public function test_customer_can_choose_maya_at_booking(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(300);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '11:00',
            'payment_method' => 'maya',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.payment.method', 'maya')
            ->assertJsonPath('data.payment.status', 'pending');
    }

    public function test_invalid_payment_method_is_rejected(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
            'payment_method' => 'paypal', // not one of cash/gcash/maya
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('payment_method');
    }

    public function test_payment_amount_always_matches_service_price_regardless_of_method(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(475.50);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
            'payment_method' => 'gcash',
            // A client-sent amount must never be trusted even if one were sent.
            'amount' => 1,
        ]);

        $response->assertStatus(201)->assertJsonPath('data.payment.amount', '475.50');
    }

    public function test_exactly_one_payment_record_is_created_per_appointment(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
            'payment_method' => 'cash',
        ]);

        $appointmentId = $response->json('data.id');

        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('payments', ['appointment_id' => $appointmentId]);
    }

    public function test_my_appointments_exposes_payment_method_and_status_to_the_owning_customer(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();

        $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
            'payment_method' => 'maya',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/my-appointments')
            ->assertStatus(200)
            ->assertJsonPath('data.0.payment.method', 'maya')
            ->assertJsonPath('data.0.payment.status', 'pending');
    }
}
