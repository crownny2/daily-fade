<?php

namespace Tests\Feature;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\BarberSchedule;
use App\Models\Notification;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7C-2 — My Schedule, My Profile, Barber Notifications.
 */
class BarberAccountFeaturesTest extends TestCase
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

    // ---------------------------------------------------------------
    // My Schedule
    // ---------------------------------------------------------------

    public function test_barber_can_view_own_schedule(): void
    {
        $barber = $this->makeBarber();
        BarberSchedule::create([
            'barber_id' => $barber->id,
            'day_of_week' => 1,
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'is_available' => true,
        ]);

        $response = $this->actingAs($barber->user, 'sanctum')
            ->getJson('/api/barber/schedule')
            ->assertStatus(200);

        $response->assertJsonPath('data.barber_id', $barber->id);
        $schedule = $response->json('data.schedule');
        $this->assertCount(7, $schedule);
        $monday = collect($schedule)->firstWhere('day_of_week', 1);
        $this->assertTrue($monday['is_available']);
        $this->assertSame('09:00', $monday['start_time']);
    }

    public function test_barber_schedule_endpoint_only_ever_returns_own_data(): void
    {
        $barberA = $this->makeBarber('Barber A');
        $barberB = $this->makeBarber('Barber B');

        BarberSchedule::create([
            'barber_id' => $barberB->id,
            'day_of_week' => 2,
            'start_time' => '10:00:00',
            'end_time' => '15:00:00',
            'is_available' => true,
        ]);

        // There's no {barber} route param to tamper with - the endpoint is
        // always scoped to $request->user()->barber. Confirm Barber A's
        // response never contains Barber B's schedule id/hours.
        $response = $this->actingAs($barberA->user, 'sanctum')
            ->getJson('/api/barber/schedule')
            ->assertStatus(200);

        $this->assertSame($barberA->id, $response->json('data.barber_id'));
        $this->assertNotSame($barberB->id, $response->json('data.barber_id'));
    }

    public function test_admin_updating_a_schedule_notifies_that_barber(): void
    {
        $barber = $this->makeBarber();
        $admin = $this->makeAdmin();

        $schedule = collect(range(0, 6))->map(fn ($day) => [
            'day_of_week' => $day,
            'is_available' => $day !== 0,
            'start_time' => '09:00',
            'end_time' => '18:00',
        ])->all();

        $this->actingAs($admin, 'sanctum')
            ->putJson("/api/admin/barber-schedules/{$barber->id}", ['schedule' => $schedule])
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_SCHEDULE_UPDATED,
        ]);
    }

    // ---------------------------------------------------------------
    // My Profile
    // ---------------------------------------------------------------

    public function test_barber_can_view_own_profile(): void
    {
        $barber = $this->makeBarber('Jayson Cruz');

        $this->actingAs($barber->user, 'sanctum')
            ->getJson('/api/barber/profile')
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Jayson Cruz')
            ->assertJsonPath('data.email', $barber->user->email)
            ->assertJsonMissingPath('data.password');
    }

    public function test_barber_can_update_own_profile(): void
    {
        $barber = $this->makeBarber();

        $this->actingAs($barber->user, 'sanctum')
            ->putJson('/api/barber/profile', [
                'name' => 'Updated Name',
                'email' => $barber->user->email,
                'phone' => '09171234567',
                'specialty' => 'Fades',
                'bio' => 'Ten years cutting hair.',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.name', 'Updated Name')
            ->assertJsonPath('data.specialty', 'Fades');

        $this->assertDatabaseHas('users', ['id' => $barber->user_id, 'name' => 'Updated Name']);
        $this->assertDatabaseHas('barbers', ['id' => $barber->id, 'specialty' => 'Fades']);
    }

    public function test_barber_profile_update_cannot_change_role(): void
    {
        $barber = $this->makeBarber();

        $this->actingAs($barber->user, 'sanctum')->putJson('/api/barber/profile', [
            'name' => $barber->user->name,
            'email' => $barber->user->email,
            'role' => 'admin', // not a validated field - must be silently ignored
        ])->assertStatus(200);

        $this->assertDatabaseHas('users', ['id' => $barber->user_id, 'role' => User::ROLE_BARBER]);
    }

    public function test_barber_cannot_set_a_new_password_without_current_password(): void
    {
        $barber = $this->makeBarber();

        $this->actingAs($barber->user, 'sanctum')->putJson('/api/barber/profile', [
            'name' => $barber->user->name,
            'email' => $barber->user->email,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    public function test_barber_profile_update_rejects_wrong_current_password(): void
    {
        $barber = $this->makeBarber();

        $this->actingAs($barber->user, 'sanctum')->putJson('/api/barber/profile', [
            'name' => $barber->user->name,
            'email' => $barber->user->email,
            'current_password' => 'not-the-real-password',
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertStatus(422)->assertJsonValidationErrors('current_password');
    }

    // ---------------------------------------------------------------
    // Notifications
    // ---------------------------------------------------------------

    public function test_barber_receives_a_notification_for_a_new_appointment(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = Service::create(['name' => 'Haircut', 'duration_minutes' => 30, 'price' => 150, 'is_active' => true]);

        Appointment::create([
            'booking_reference' => 'BRB-TEST-0001',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
        ]);
    }

    public function test_barber_can_view_own_notifications_and_unread_count(): void
    {
        $barber = $this->makeBarber();

        Notification::create([
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
            'title' => 'New Appointment',
            'message' => 'Test',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
            'title' => 'Confirmed',
            'message' => 'Test',
            'is_read' => true,
        ]);

        $this->actingAs($barber->user, 'sanctum')
            ->getJson('/api/barber/notifications')
            ->assertStatus(200)
            ->assertJsonPath('meta.unread_count', 1)
            ->assertJsonCount(2, 'data');
    }

    public function test_barber_cannot_see_or_touch_another_barbers_notification(): void
    {
        $barberA = $this->makeBarber('Barber A');
        $barberB = $this->makeBarber('Barber B');

        $notification = Notification::create([
            'user_id' => $barberB->user_id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
            'title' => "Barber B's notification",
            'message' => 'Test',
            'is_read' => false,
        ]);

        // Not visible in Barber A's list.
        $list = $this->actingAs($barberA->user, 'sanctum')
            ->getJson('/api/barber/notifications')
            ->json('data');
        $this->assertEmpty(collect($list)->where('id', $notification->id));

        // Not markable by Barber A either.
        $this->actingAs($barberA->user, 'sanctum')
            ->patchJson("/api/barber/notifications/{$notification->id}/read")
            ->assertStatus(403);
    }

    public function test_barber_can_mark_a_notification_read_and_mark_all_read(): void
    {
        $barber = $this->makeBarber();

        $n1 = Notification::create([
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_NEW,
            'title' => 'One',
            'message' => 'Test',
            'is_read' => false,
        ]);
        Notification::create([
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
            'title' => 'Two',
            'message' => 'Test',
            'is_read' => false,
        ]);

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/notifications/{$n1->id}/read")
            ->assertStatus(200)
            ->assertJsonPath('data.is_read', true);

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson('/api/barber/notifications/read-all')
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', ['user_id' => $barber->user_id, 'is_read' => false]);
    }

    // ---------------------------------------------------------------
    // Authorization across all three new areas
    // ---------------------------------------------------------------

    public function test_customer_cannot_access_barber_account_endpoints(): void
    {
        $customer = $this->makeCustomer();

        $this->actingAs($customer, 'sanctum')->getJson('/api/barber/schedule')->assertStatus(403);
        $this->actingAs($customer, 'sanctum')->getJson('/api/barber/profile')->assertStatus(403);
        $this->actingAs($customer, 'sanctum')->getJson('/api/barber/notifications')->assertStatus(403);
    }

    public function test_unauthenticated_user_cannot_access_barber_account_endpoints(): void
    {
        $this->getJson('/api/barber/schedule')->assertStatus(401);
        $this->getJson('/api/barber/profile')->assertStatus(401);
        $this->getJson('/api/barber/notifications')->assertStatus(401);
    }

    public function test_barber_cannot_access_admin_only_endpoints(): void
    {
        $barber = $this->makeBarber();

        $this->actingAs($barber->user, 'sanctum')->getJson('/api/admin/dashboard')->assertStatus(403);
    }

    public function test_barber_is_not_notified_of_their_own_status_change(): void
    {
        $barber = $this->makeBarber();
        $customer = $this->makeCustomer();
        $service = Service::create(['name' => 'Haircut', 'duration_minutes' => 30, 'price' => 150, 'is_active' => true]);

        $appointment = Appointment::create([
            'booking_reference' => 'BRB-TEST-SELF',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'start_time' => '10:00:00',
            'end_time' => '10:30:00',
            'status' => 'pending',
        ]);

        // Clear the "new appointment" notification created above so we can
        // isolate the status-change notification.
        Notification::where('user_id', $barber->user_id)->delete();

        $this->actingAs($barber->user, 'sanctum')
            ->patchJson("/api/barber/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200);

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
        ]);
    }

    public function test_barber_is_notified_when_admin_changes_their_appointment_status(): void
    {
        $barber = $this->makeBarber();
        $admin = $this->makeAdmin();
        $customer = $this->makeCustomer();
        $service = Service::create(['name' => 'Haircut', 'duration_minutes' => 30, 'price' => 150, 'is_active' => true]);

        $appointment = Appointment::create([
            'booking_reference' => 'BRB-TEST-ADMINACT',
            'customer_id' => $customer->id,
            'barber_id' => $barber->id,
            'service_id' => $service->id,
            'appointment_date' => Carbon::tomorrow()->toDateString(),
            'start_time' => '11:00:00',
            'end_time' => '11:30:00',
            'status' => 'pending',
        ]);

        $this->actingAs($admin, 'sanctum')
            ->patchJson("/api/admin/appointments/{$appointment->id}/status", ['status' => 'confirmed'])
            ->assertStatus(200);

        $this->assertDatabaseHas('notifications', [
            'user_id' => $barber->user_id,
            'type' => Notification::TYPE_APPOINTMENT_CONFIRMED,
        ]);
    }
}
