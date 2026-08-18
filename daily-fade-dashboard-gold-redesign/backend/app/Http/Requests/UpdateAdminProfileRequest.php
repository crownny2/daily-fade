<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAdminProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
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
            // Password change is optional. If the admin wants to change it,
            // current_password + new password (confirmed) are all required.
            'current_password' => ['required_with:password', 'string'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }
}
