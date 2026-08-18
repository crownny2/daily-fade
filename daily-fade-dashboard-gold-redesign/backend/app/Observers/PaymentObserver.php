<?php

namespace App\Observers;

use App\Models\Payment;
use App\Services\NotificationService;

class PaymentObserver
{
    public function __construct(private NotificationService $notifications)
    {
    }

    /**
     * Fires whenever a payment is saved. Only reacts when 'status' actually
     * changed - the initial "pending" row created alongside a new
     * appointment doesn't go through here (created(), not updated()), and
     * a save that doesn't touch status won't create a duplicate.
     */
    public function updated(Payment $payment): void
    {
        if (! $payment->wasChanged('status')) {
            return;
        }

        $this->notifications->paymentStatusChanged($payment);
    }
}
