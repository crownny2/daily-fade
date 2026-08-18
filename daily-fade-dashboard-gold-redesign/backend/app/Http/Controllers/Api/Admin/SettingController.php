<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAdminProfileRequest;
use App\Http\Requests\UpdateBusinessSettingsRequest;
use App\Models\BusinessSetting;
use Illuminate\Support\Facades\Hash;

class SettingController extends Controller
{
    /**
     * GET /api/admin/settings
     * Returns business info, business hours, booking settings, and payment
     * settings, plus the logged-in admin's own profile (name/email) for the
     * Admin Profile section — the actual password is never exposed.
     */
    public function index()
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatSettings(BusinessSetting::current()),
        ]);
    }

    /**
     * PUT /api/admin/settings
     * Updates business info, business hours, booking settings, and payment
     * method toggles in one request. Single settings row — no duplicate
     * settings systems, no touching barber_schedules.
     */
    public function update(UpdateBusinessSettingsRequest $request)
    {
        $validated = $request->validated();

        $settings = BusinessSetting::current();
        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Settings updated.',
            'data' => $this->formatSettings($settings->fresh()),
        ]);
    }

    /**
     * PUT /api/admin/profile
     * Updates the logged-in admin's own name/email, and optionally their
     * password (requires current_password). Never returns password/tokens.
     */
    public function updateProfile(UpdateAdminProfileRequest $request)
    {
        $user = $request->user();
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
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Profile updated.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    private function formatSettings(BusinessSetting $settings): array
    {
        return [
            'business_name' => $settings->business_name,
            'address' => $settings->address,
            'phone' => $settings->phone,
            'email' => $settings->email,
            'website' => $settings->website,
            'business_hours' => $settings->normalizedBusinessHours(),
            'min_booking_notice_minutes' => $settings->min_booking_notice_minutes,
            'max_advance_booking_days' => $settings->max_advance_booking_days,
            'online_booking_enabled' => $settings->online_booking_enabled,
            'default_appointment_status' => $settings->default_appointment_status,
            'payment_cash_enabled' => $settings->payment_cash_enabled,
            'payment_gcash_enabled' => $settings->payment_gcash_enabled,
            'payment_maya_enabled' => $settings->payment_maya_enabled,
            'updated_at' => optional($settings->updated_at)->toDateTimeString(),
        ];
    }
}
