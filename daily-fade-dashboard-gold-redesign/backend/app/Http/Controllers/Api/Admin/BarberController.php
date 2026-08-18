<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Admin\BarberResource;
use App\Models\Barber;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BarberController extends Controller
{
    /**
     * Admin: list all barbers (active + inactive), with optional search
     * (name / specialty / email) and status filter. Reuses the existing
     * Barber + User models — no new tables.
     */
    public function index(Request $request)
    {
        $query = Barber::query()->with('user')->withCount('appointments');

        if ($request->filled('search')) {
            $search = $request->string('search');

            $query->where(function ($q) use ($search) {
                $q->where('specialty', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->string('status') === 'active');
        }

        $barbers = $query->get()->sortBy(fn (Barber $barber) => $barber->user->name ?? '')->values();

        return response()->json([
            'success' => true,
            'data' => BarberResource::collection($barbers),
        ]);
    }

    /**
     * Admin: view a single barber's full details, including appointment count.
     */
    public function show(Barber $barber)
    {
        return response()->json([
            'success' => true,
            'data' => new BarberResource($barber->load('user')->loadCount('appointments')),
        ]);
    }

    /**
     * Admin: create a new barber. This creates the underlying User account
     * (role=barber) plus the Barber profile row, since a barber must have
     * both to be usable anywhere else in the system (login, schedules,
     * appointments). The account password is a random unusable-until-reset
     * value — this page only manages the barber's booking profile, not
     * barber login/auth flows (out of scope for Phase 6D).
     */
    public function store(Request $request)
    {
        $validated = $this->validateBarber($request);

        $user = User::create([
            'name' => $this->fullName($validated),
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make(Str::random(32)),
            'role' => User::ROLE_BARBER,
        ]);

        $barber = Barber::create([
            'user_id' => $user->id,
            'specialty' => $validated['specialty'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barber created.',
            'data' => new BarberResource($barber->fresh('user')->loadCount('appointments')),
        ], 201);
    }

    /**
     * Admin: update a barber's name/email/phone/specialty/status.
     */
    public function update(Request $request, Barber $barber)
    {
        $validated = $this->validateBarber($request, $barber->user_id);

        $barber->user->update([
            'name' => $this->fullName($validated),
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ]);

        $barber->update([
            'specialty' => $validated['specialty'],
            'is_active' => $validated['is_active'] ?? $barber->is_active,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Barber updated.',
            'data' => new BarberResource($barber->fresh('user')->loadCount('appointments')),
        ]);
    }

    /**
     * Quick activate/deactivate toggle. Deactivating a barber never deletes
     * them or touches their historical appointments — it only flips
     * is_active, which is the same flag GET /api/barbers (the public,
     * customer-facing barber list used by the booking flow) already
     * filters on. So an inactive barber simply stops appearing as a
     * bookable option, while past appointments remain untouched.
     */
    public function toggleStatus(Barber $barber)
    {
        $barber->update(['is_active' => ! $barber->is_active]);

        return response()->json([
            'success' => true,
            'message' => $barber->is_active ? 'Barber activated.' : 'Barber deactivated.',
            'data' => new BarberResource($barber->fresh('user')->loadCount('appointments')),
        ]);
    }

    private function validateBarber(Request $request, ?int $ignoreUserId = null): array
    {
        return $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'string', 'email', 'max:255',
                Rule::unique('users', 'email')->ignore($ignoreUserId),
            ],
            'phone' => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\-\s()]{7,20}$/'],
            'specialty' => ['required', 'string', 'max:255'],
            'is_active' => ['sometimes', 'boolean'],
        ]);
    }

    private function fullName(array $validated): string
    {
        return trim($validated['first_name'].' '.$validated['last_name']);
    }
}
