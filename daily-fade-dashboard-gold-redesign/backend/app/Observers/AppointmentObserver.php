<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Services\NotificationService;

class AppointmentObserver
{
    public function __construct(private NotificationService $notifications)
    {
    }

    public function created(Appointment $appointment): void
    {
        $this->notifications->appointmentCreated($appointment);
    }

    /**
     * Fires for every status change, wherever it happens - admin's
     * updateStatus() action or a customer's self-service cancel(). Only
     * reacts when 'status' actually changed, so a save() that touches
     * other columns doesn't create a duplicate notification.
     */
    public function updated(Appointment $appointment): void
    {
        if (!$appointment->wasChanged('status')) {
            return;
        }

        if ($appointment->status === 'cancelled') {
            $this->releasePaymentOnCancel($appointment);
        }

        $this->notifications->appointmentStatusChanged($appointment);
    }

    /**
     * A cancelled appointment must never keep counting as collected
     * revenue. If it had already been paid, flip the payment to
     * 'refunded' - the closest existing status - so it drops out of
     * every 'paid' aggregate (Dashboard revenue cards/trend, Reports
     * revenue/payment breakdown/recent transactions) automatically,
     * without those controllers needing to know about cancellation at
     * all. This also fires PaymentObserver, which already sends a
     * correct "Payment Refunded" notification for the change.
     *
     * An unpaid (still 'pending') payment is left as-is here - nothing
     * was collected, so there's nothing to refund. It's excluded from
     * the Dashboard's "pending payments" total separately, by filtering
     * out cancelled appointments in that query.
     */
    private function releasePaymentOnCancel(Appointment $appointment): void
    {
        $payment = $appointment->payment;

        if ($payment && $payment->status === 'paid') {
            $payment->update(['status' => 'refunded']);
        }
    }
}
