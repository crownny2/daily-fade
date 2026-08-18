<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Phase 7A test matrix: authentication, role-based authorization, and the
 * privilege-escalation guards around registration/role changes.
 */
class AuthenticationAndRoleAccessTest extends TestCase
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

    // ---------------------------------------------------------------
    // Registration
    // ---------------------------------------------------------------

    public function test_registration_always_creates_a_customer(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'New Person',
            'email' => 'new.person@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertStatus(201)
            ->assertJsonPath('user.role', 'customer');

        $this->assertDatabaseHas('users', [
            'email' => 'new.person@example.test',
            'role' => 'customer',
        ]);
    }

    public function test_registration_ignores_a_spoofed_admin_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Sneaky Person',
            'email' => 'sneaky@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ])->assertStatus(201)
            ->assertJsonPath('user.role', 'customer');

        $this->assertDatabaseHas('users', [
            'email' => 'sneaky@example.test',
            'role' => 'customer',
        ]);
    }

    public function test_registration_response_never_exposes_password(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Private Person',
            'email' => 'private@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)->assertJsonMissingPath('user.password');
    }

    // ---------------------------------------------------------------
    // Login / logout / invalid credentials
    // ---------------------------------------------------------------

    public function test_login_succeeds_with_valid_credentials_for_each_role(): void
    {
        foreach (['admin', 'barber', 'customer'] as $role) {
            $user = $this->makeUser($role);

            $this->postJson('/api/auth/login', [
                'email' => $user->email,
                'password' => 'password',
            ])->assertStatus(200)
                ->assertJsonPath('user.role', $role)
                ->assertJsonStructure(['user', 'token']);
        }
    }

    public function test_login_rejects_invalid_credentials(): void
    {
        $user = $this->makeUser('customer');

        $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ])->assertStatus(422);
    }

    public function test_authenticated_user_can_fetch_their_own_profile(): void
    {
        $user = $this->makeUser('customer');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/auth/user')
            ->assertStatus(200)
            ->assertJsonPath('user.id', $user->id)
            ->assertJsonMissingPath('user.password');
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = $this->makeUser('customer');
        $token = $user->createToken('auth_token')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/auth/logout')
            ->assertStatus(200);

        // The same token must no longer work for a protected endpoint.
        $this->withHeader('Authorization', "Bearer {$token}")
            ->getJson('/api/auth/user')
            ->assertStatus(401);
    }

    public function test_unauthenticated_request_to_protected_endpoint_is_401(): void
    {
        $this->getJson('/api/auth/user')->assertStatus(401);
    }

    // ---------------------------------------------------------------
    // Admin API authorization
    // ---------------------------------------------------------------

    public function test_admin_can_access_admin_api(): void
    {
        $admin = $this->makeUser('admin');

        $this->actingAs($admin, 'sanctum')
            ->getJson('/api/admin/ping')
            ->assertStatus(200);
    }

    public function test_customer_gets_403_on_admin_api(): void
    {
        $customer = $this->makeUser('customer');

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/admin/ping')
            ->assertStatus(403);
    }

    public function test_barber_gets_403_on_admin_api(): void
    {
        $barber = $this->makeUser('barber');

        $this->actingAs($barber, 'sanctum')
            ->getJson('/api/admin/ping')
            ->assertStatus(403);
    }

    public function test_unauthenticated_request_to_admin_api_is_401(): void
    {
        $this->getJson('/api/admin/ping')->assertStatus(401);
    }

    /**
     * A representative sample of the concrete admin endpoints listed in the
     * Phase 7A spec — not just the /admin/ping placeholder — to prove the
     * `role:admin` middleware is actually applied to the real routes.
     */
    public function test_customer_gets_403_on_concrete_admin_endpoints(): void
    {
        $customer = $this->makeUser('customer');

        foreach ([
            '/api/admin/dashboard',
            '/api/admin/appointments',
            '/api/admin/services',
            '/api/admin/barbers',
            '/api/admin/barber-schedules',
            '/api/admin/customers',
            '/api/admin/payments',
            '/api/admin/reports',
            '/api/admin/notifications',
            '/api/admin/settings',
        ] as $endpoint) {
            $this->actingAs($customer, 'sanctum')
                ->getJson($endpoint)
                ->assertStatus(403, "Expected 403 from customer on {$endpoint}");
        }
    }

    // ---------------------------------------------------------------
    // Barber/customer scoped API
    // ---------------------------------------------------------------

    public function test_barber_can_access_barber_api(): void
    {
        $barber = $this->makeUser('barber');

        $this->actingAs($barber, 'sanctum')
            ->getJson('/api/barber/ping')
            ->assertStatus(200);
    }

    public function test_admin_and_customer_cannot_access_barber_api(): void
    {
        $admin = $this->makeUser('admin');
        $customer = $this->makeUser('customer');

        $this->actingAs($admin, 'sanctum')->getJson('/api/barber/ping')->assertStatus(403);
        $this->actingAs($customer, 'sanctum')->getJson('/api/barber/ping')->assertStatus(403);
    }

    // ---------------------------------------------------------------
    // Self-promotion is not possible: no endpoint accepts a client role
    // ---------------------------------------------------------------

    public function test_role_is_not_mass_assignable_from_registration_payload(): void
    {
        // Belt-and-braces on top of test_registration_ignores_a_spoofed_admin_role:
        // confirm the persisted role for a barber-role spoof too.
        $this->postJson('/api/auth/register', [
            'name' => 'Also Sneaky',
            'email' => 'also.sneaky@example.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'barber',
        ])->assertJsonPath('user.role', 'customer');
    }
}
