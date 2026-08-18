<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateBarberProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isBarber() ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($this->user()?->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'specialty' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:2000'],
            // Password change is optional, same pattern as the Admin
            // profile: current_password + new password (confirmed) are
            // only required if the barber is actually changing it.
            'current_password' => ['required_with:password', 'string'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }
}
