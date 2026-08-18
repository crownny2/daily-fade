<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    /**
     * Admins can view any appointment; customers may only view their own;
     * barbers may only view appointments assigned to their barber profile.
     */
    public function view(User $user, Appointment $appointment): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        if ($user->isCustomer()) {
            return $appointment->customer_id === $user->id;
        }

        if ($user->isBarber()) {
            return $appointment->barber_id === $user->barber?->id;
        }

        return false;
    }
}
