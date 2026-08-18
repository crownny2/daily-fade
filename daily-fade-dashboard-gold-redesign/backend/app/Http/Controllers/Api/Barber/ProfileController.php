<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateBarberProfileRequest;
use App\Http\Resources\Admin\BarberResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * GET /api/barber/profile
     * Reuses Admin\BarberResource - same shape the admin already sees when
     * managing barbers (name/email/phone/specialty/bio), just scoped to
     * the authenticated barber's own record instead of an admin-chosen one.
     */
    public function show(Request $request)
    {
        $barber = $request->user()->barber;

        if (! $barber) {
            return response()->json([
                'success' => false,
                'message' => 'No barber profile is linked to this account.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => new BarberResource($barber->load('user')),
        ]);
    }

    /**
     * PUT /api/barber/profile
     * Updates the barber's own User fields (name/email/phone, optionally
     * password) and their own Barber fields (specialty/bio). Never touches
     * role, barber id, is_active, or any other user's data - those simply
     * aren't in the validated payload (see UpdateBarberProfileRequest).
     */
    public function update(UpdateBarberProfileRequest $request)
    {
        $user = $request->user();
        $barber = $user->barber;

        if (! $barber) {
            return response()->json([
                'success' => false,
                'message' => 'No barber profile is linked to this account.',
            ], 404);
        }

        $validated = $request->validated();

        if (! empty($validated['password'])) {
            if (! Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'The current password is incorrect.',
                    'errors' => ['current_password' => ['The current password is incorrect.']],
                ], 422);
            }

            $user->password = Hash::make($validated['password']);
        }

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        $user->phone = $validated['phone'] ?? null;
        $user->save();

        $barber->specialty = $validated['specialty'] ?? null;
        $barber->bio = $validated['bio'] ?? null;
        $barber->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated.',
            'data' => new BarberResource($barber->fresh('user')),
        ]);
    }
}
