<?php

namespace Tests\Feature;

use App\Models\Barber;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAppointmentTest extends TestCase
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

    public function test_admin_can_view_appointments(): void
    {
        $admin = $this->makeUser(User::ROLE_ADMIN);

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/appointments')
            ->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    public function test_customer_cannot_access_admin_appointments(): void
    {
        $customer = $this->makeUser(User::ROLE_CUSTOMER);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/admin/appointments')
            ->assertStatus(403);
    }

    public function test_barber_cannot_access_admin_appointments(): void
    {
        $barberUser = $this->makeUser(User::ROLE_BARBER);
        Barber::create(['user_id' => $barberUser->id, 'is_active' => true]);

        $this->actingAs($barberUser, 'sanctum')
            ->getJson('/api/admin/appointments')
            ->assertStatus(403);
    }
}
