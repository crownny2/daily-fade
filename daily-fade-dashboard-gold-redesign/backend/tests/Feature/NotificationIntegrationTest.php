<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7D-2 — Payment & Appointment Notification Integration.
 *
 * Covers the piece that was missing going into this phase: the Customer
 * did not receive any notifications at all (only Admin and Barber did,
 * from Phase 6H / 7C-2). These tests exercise the full flow end to end
 * through the real HTTP/DB layer (no mocked notifications) and check
 * authorization + duplicate-prevention along the way.
 */
class NotificationIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function makeCustomer(string $name = 'Test Customer'): User
    {
        return User::create([
            'name' => $name,
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

    private function makeBarberWithSchedule(string $name = 'Test Barber'): Barber
    {
        $user = User::create([
            'name' => $name,
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

    private function bookAppointment(User $customer, Barber $barber, Service $service, string $method = 'cash'): array
    {
        $response = $this->actingAs($customer, 'sanctum')->postJson('/api/appointments', [
            'service_id' => $service->id,
            'barber_id' => $barber->id,
            'appointment_date' => $this->nextMonday()->toDateString(),
            'start_time' => '10:00',
            'payment_method' => $method,
        ]);

        $response->assertStatus(201);

        return $response->json('data');
    }

    // ---------------------------------------------------------------
    // 1. Booking notifications (customer + barber + admin)
    // ---------------------------------------------------------------

    public function test_creating_an_appointment_notifies_customer_barber_and_admin(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();

        $appointment = $this->bookAppointment($customer, $barber, $service);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
            'notifiable_id' => $appointment['id'],
            'notifiable_type' => Appointment::class,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
            'notifiable_id' => $appointment['id'],
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $admin->id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
            'notifiable_id' => $appointment['id'],
        ]);

        $customerNotification = Notification::where('user_id', $customer->id)->first();
        $this->assertStringContainsString($appointment['booking_reference'], $customerNotification->message);
        $this->assertSame($appointment['id'], $customerNotification->data['appointment_id']);
    }

    // ---------------------------------------------------------------
    // 2. Appointment status notifications
    // ---------------------------------------------------------------

    public function test_admin_confirming_appointment_notifies_only_customer_not_barber(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $appointment = $this->bookAppointment($customer, $barber, $service);

        Notification::query()->delete(); // isolate this action's notifications

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment['id']}/status", ['status' => 'confirmed'])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
        ]);
    }

    public function test_cancelling_appointment_notifies_customer_and_barber(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $appointment = $this->bookAppointment($customer, $barber, $service);

        Notification::query()->delete();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment['id']}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_APPOINTMENT_CANCELLED,
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_CANCELLED,
        ]);
    }

    public function test_completing_appointment_notifies_customer(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $appointment = $this->bookAppointment($customer, $barber, $service);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment['id']}/status", ['status' => 'confirmed'])
            ->assertOk();

        Notification::query()->delete();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment['id']}/status", ['status' => 'completed'])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_APPOINTMENT_COMPLETED,
        ]);
    }

    public function test_status_update_that_does_not_change_status_creates_no_duplicate_notification(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $appointment = $this->bookAppointment($customer, $barber, $service);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment['id']}/status", ['status' => 'confirmed'])
            ->assertOk();

        $countAfterFirst = Notification::where('user_id', $customer->id)
            ->where('type', Notification::TYPE_APPOINTMENT_CONFIRMED)
            ->count();

        // Re-sending the same status should not create a second row, since
        // the observer only fires on an actual column change.
        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment['id']}/status", ['status' => 'confirmed'])
            ->assertOk();

        $countAfterSecond = Notification::where('user_id', $customer->id)
            ->where('type', Notification::TYPE_APPOINTMENT_CONFIRMED)
            ->count();

        $this->assertSame(1, $countAfterFirst);
        $this->assertSame($countAfterFirst, $countAfterSecond);
    }

    // ---------------------------------------------------------------
    // 3. Payment notifications
    // ---------------------------------------------------------------

    public function test_admin_marking_cash_payment_paid_notifies_customer(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(300);
        $appointment = $this->bookAppointment($customer, $barber, $service, 'cash');

        Notification::query()->delete();

        $payment = Payment::where('appointment_id', $appointment['id'])->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->id}/status", [
                'status' => 'paid',
                'method' => 'cash',
            ])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_PAYMENT_PAID,
            'notifiable_id' => $payment->id,
            'notifiable_type' => Payment::class,
        ]);
    }

    public function test_marking_payment_failed_notifies_customer(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(300);
        $appointment = $this->bookAppointment($customer, $barber, $service, 'gcash');

        Notification::query()->delete();

        $payment = Payment::where('appointment_id', $appointment['id'])->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->id}/status", ['status' => 'failed'])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_PAYMENT_FAILED,
        ]);

        // GCash/Maya are never silently marked paid - failure is a real,
        // explicit admin action, not an assumed gateway success.
        $this->assertDatabaseMissing('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_PAYMENT_PAID,
        ]);
    }

    public function test_marking_payment_refunded_notifies_customer(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService(300);
        $appointment = $this->bookAppointment($customer, $barber, $service, 'cash');
        $payment = Payment::where('appointment_id', $appointment['id'])->firstOrFail();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->id}/status", ['status' => 'paid', 'method' => 'cash'])
            ->assertOk();

        Notification::query()->delete();

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/payments/{$payment->id}/status", ['status' => 'refunded'])
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $customer->id,
            'type' => Notification::TYPE_PAYMENT_REFUNDED,
        ]);
    }

    // ---------------------------------------------------------------
    // 9-11. Unread count, mark read / read-all, duplicate prevention
    // ---------------------------------------------------------------

    public function test_customer_can_list_notifications_with_unread_count(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $this->bookAppointment($customer, $barber, $service);

        $response = $this->actingAs($customer, 'sanctum')->getJson('/api/customer/notifications');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonCount(1, 'data');
    }

    public function test_customer_can_mark_notification_read_and_unread_count_drops(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $this->bookAppointment($customer, $barber, $service);

        $notification = Notification::where('user_id', $customer->id)->firstOrFail();

        $this->actingAs($customer, 'sanctum')
            ->patchJson("/api/customer/notifications/{$notification->id}/read")
            ->assertOk()
            ->assertJsonPath('data.is_read', true);

        $response = $this->actingAs($customer, 'sanctum')->getJson('/api/customer/notifications');
        $response->assertJsonPath('meta.unread_count', 0);
    }

    public function test_customer_can_mark_all_notifications_read(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $this->bookAppointment($customer, $barber, $service);

        $this->actingAs($customer, 'sanctum')
            ->patchJson('/api/customer/notifications/read-all')
            ->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $customer->id,
            'is_read' => false,
        ]);
    }

    // ---------------------------------------------------------------
    // 10. Authorization - customers cannot touch each other's notifications
    // ---------------------------------------------------------------

    public function test_customer_cannot_mark_another_customers_notification_read(): void
    {
        $customerA = $this->makeCustomer('Customer A');
        $customerB = $this->makeCustomer('Customer B');
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $this->bookAppointment($customerA, $barber, $service);

        $notification = Notification::where('user_id', $customerA->id)->firstOrFail();

        $this->actingAs($customerB, 'sanctum')
            ->patchJson("/api/customer/notifications/{$notification->id}/read")
            ->assertStatus(403);
    }

    public function test_customer_only_sees_own_notifications_in_index(): void
    {
        $customerA = $this->makeCustomer('Customer A');
        $customerB = $this->makeCustomer('Customer B');
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $this->bookAppointment($customerA, $barber, $service);
        $this->bookAppointment($customerB, $barber, $service);

        $response = $this->actingAs($customerA, 'sanctum')->getJson('/api/customer/notifications');

        $response->assertOk()->assertJsonCount(1, 'data');
        $this->assertSame($customerA->id, Notification::where('id', $response->json('data.0.id'))->value('user_id'));
    }

    public function test_barber_cannot_access_customer_notification_routes(): void
    {
        $barber = $this->makeBarberWithSchedule();

        $this->actingAs($barber->user, 'sanctum')
            ->getJson('/api/customer/notifications')
            ->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // 12. Existing features still work
    // ---------------------------------------------------------------

    public function test_existing_booking_and_my_appointments_flow_still_works(): void
    {
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $appointment = $this->bookAppointment($customer, $barber, $service);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/my-appointments')
            ->assertOk()
            ->assertJsonFragment(['id' => $appointment['id']]);
    }

    public function test_existing_admin_and_barber_notification_endpoints_still_work(): void
    {
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $barber = $this->makeBarberWithSchedule();
        $service = $this->makeService();
        $this->bookAppointment($customer, $barber, $service);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1);

        $this->actingAs($barber->user, 'sanctum')
            ->getJson('/api/barber/notifications')
            ->assertOk()
            ->assertJsonPath('meta.unread_count', 1);
    }
}
