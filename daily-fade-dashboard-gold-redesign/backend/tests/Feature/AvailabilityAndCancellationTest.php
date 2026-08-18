<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Models\BusinessSetting;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7B: covers the gap between what /availability shows as bookable
 * and what POST /appointments actually accepts, plus cancellation
 * side-effects (slot freed, admin visibility) and the booking reference
 * format.
 */
class AvailabilityAndCancellationTest extends TestCase
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

    private function makeAdmin(): User
    {
        return User::create([
            'name' => 'Test Admin',
            'email' => uniqid('admin_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_ADMIN,
        ]);
    }

    private function makeBarberWithSchedule(array $days = [1, 2, 3, 4, 5, 6]): Barber
    {
        $user = User::create([
            'name' => 'Test Barber',
            'email' => uniqid('barber_') . '@example.test',
            'password' => bcrypt('password'),
            'role' => User::ROLE_BARBER,
        ]);

        $barber = Barber::create(['user_id' => $user->id, 'is_active' => true]);

        foreach ($days as $day) {
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

    private function nextDateFor(int $dayOfWeek): Carbon
    {
        $date = Carbon::today()->addDay();
        while ($date->dayOfWeek !== $dayOfWeek) {
            $date->addDay();
        }

        return $date;
    }

    // ---------------------------------------------------------------
    // Availability endpoint must agree with what booking will accept
    // ---------------------------------------------------------------

    public function test_availability_hides_slots_beyond_max_advance_booking_days(): void
    {
        $barber = $this->makeBarberWithSchedule(range(0, 6));
        $service = $this->makeService();
        $customer = $this->makeCustomer();

        $settings = BusinessSetting::current();
        $settings->update(['max_advance_booking_days' => 7]);

        $tooFar = Carbon::today()->addDays(30);

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/barbers/{$barber->id}/availability?date={$tooFar->toDateString()}&service_id={$service->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.slots', []);
    }

    public function test_availability_hides_slots_when_shop_closed_that_day(): void
    {
        $barber = $this->makeBarberWithSchedule(range(0, 6)); // barber works every day
        $service = $this->makeService();
        $customer = $this->makeCustomer();

        $settings = BusinessSetting::current();
        $hours = collect($settings->normalizedBusinessHours())->map(function ($row) {
            if ($row['day_of_week'] === 0) {
                $row['is_open'] = false; // shop closed Sundays, even though the barber is scheduled
            }
            return $row;
        })->values()->all();
        $settings->update(['business_hours' => $hours]);

        $sunday = $this->nextDateFor(0);

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/barbers/{$barber->id}/availability?date={$sunday->toDateString()}&service_id={$service->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.slots', []);
    }

    public function test_availability_hides_slots_when_online_booking_disabled(): void
    {
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $customer = $this->makeCustomer();
        $date = $this->nextDateFor(1);

        BusinessSetting::current()->update(['online_booking_enabled' => false]);

        $this->actingAs($customer, 'sanctum')
            ->getJson("/api/barbers/{$barber->id}/availability?date={$date->toDateString()}&service_id={$service->id}")
            ->assertStatus(200)
            ->assertJsonPath('data.slots', []);
    }

    public function test_a_slot_shown_as_available_can_actually_be_booked(): void
    {
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(30);
        $customer = $this->makeCustomer();
        $date = $this->nextDateFor(1);

        $availability = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/barbers/{$barber->id}/availability?date={$date->toDateString()}&service_id={$service->id}")
            ->assertStatus(200)
            ->json('data.slots');

        $firstOpenSlot = collect($availability)->firstWhere('available', true);
        $this->assertNotNull($firstOpenSlot, 'Expected at least one open slot.');

        $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => $firstOpenSlot['start_time'],
        ])->assertStatus(201);
    }

    // ---------------------------------------------------------------
    // Cancellation side-effects
    // ---------------------------------------------------------------

    public function test_cancelling_an_appointment_frees_the_slot(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(45);
        $date = $this->nextDateFor(1);

        $appointment = Appointment::create([
            'booking_reference' => 'BRB-TEST-CANCEL',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:45:00',
            'status' => 'confirmed',
        ]);

        // Before cancelling: 10:00 slot is occupied.
        $before = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/barbers/{$barber->id}/availability?date={$date->toDateString()}&service_id={$service->id}")
            ->json('data.slots');
        $slotBefore = collect($before)->firstWhere('start_time', '10:00');
        $this->assertFalse($slotBefore['available']);

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/my-appointments/{$appointment->id}/cancel")
            ->assertStatus(200)
            ->assertJsonPath('data.status', 'cancelled');

        // After cancelling: the same slot is free again.
        $after = $this->actingAs($customer, 'sanctum')
            ->getJson("/api/barbers/{$barber->id}/availability?date={$date->toDateString()}&service_id={$service->id}")
            ->json('data.slots');
        $slotAfter = collect($after)->firstWhere('start_time', '10:00');
        $this->assertTrue($slotAfter['available']);
    }

    public function test_admin_sees_the_cancellation_immediately(): void
    {
        $customer = $this->makeCustomer();
        $admin = $this->makeAdmin();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $appointment = Appointment::create([
            'booking_reference' => 'BRB-TEST-ADMINVIEW',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'status' => 'confirmed',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/my-appointments/{$appointment->id}/cancel")
            ->assertStatus(200);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/appointments')
            ->assertStatus(200)
            ->assertJsonFragment(['id' => $appointment->id, 'status' => 'cancelled']);
    }

    public function test_completed_appointment_cannot_be_cancelled_by_customer(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $appointment = Appointment::create([
            'booking_reference' => 'BRB-TEST-DONE',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '09:30:00',
            'status' => 'completed',
        ]);

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/my-appointments/{$appointment->id}/cancel")
            ->assertStatus(422);
    }

    // ---------------------------------------------------------------
    // Booking reference format
    // ---------------------------------------------------------------

    public function test_booking_reference_matches_expected_format(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ]);

        $response->assertStatus(201);
        $reference = $response->json('data.booking_reference');

        $this->assertMatchesRegularExpression('/^BRB-\d{8}-\d{4}$/', $reference);
    }

    // ---------------------------------------------------------------
    // Inactive service / barber can't be booked even if IDs are valid
    // ---------------------------------------------------------------

    public function test_inactive_service_cannot_be_booked(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $service->update(['is_active' => false]);
        $date = $this->nextDateFor(1);

        $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ])->assertStatus(422)->assertJsonValidationErrors('service_id');
    }

    public function test_inactive_barber_cannot_be_booked(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $barber->update(['is_active' => false]);
        $service = $this->makeService();
        $date = $this->nextDateFor(1);

        $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $date->toDateString(),
            'start_time' => '10:00',
        ])->assertStatus(422)->assertJsonValidationErrors('barber_id');
    }
}
