<?php

namespace App\Observers;

use App\Models\User;
use App\Services\NotificationService;

class UserObserver
{
    public function __construct(private NotificationService $notifications)
    {
    }

    /**
     * Only customer accounts are notified — admin/barber accounts are
     * created by admins themselves and don't need to notify anyone.
     */
    public function created(User $user): void
    {
        if ($user->role !== User::ROLE_CUSTOMER) {
            return;
        }

        $this->notifications->customerRegistered($user);
    }
}
