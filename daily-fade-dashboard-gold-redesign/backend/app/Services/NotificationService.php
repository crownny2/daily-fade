<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * Phase 6H: Admin Notifications. Phase 7D-2: extended to also notify the
 * Customer and Barber for the same events.
 *
 * Fans a single event out into one Notification row per recipient. Called
 * from model observers (AppointmentObserver, PaymentObserver, UserObserver)
 * so every path that changes status - admin actions, barber actions, or
 * customer actions - produces exactly one notification per recipient,
 * without duplicating booking/payment business logic here.
 */
class NotificationService
{
    /**
     * New appointment was created (by a customer via the booking wizard).
     * Admins get the full picture; the assigned barber gets a
     * barber-worded copy of the same event ("with you").
     */
    public function appointmentCreated(Appointment $appointment): void
    {
        $appointment->loadMissing(['customer', 'barber.user', 'service']);
        $data = $this->appointmentData($appointment);

        $this->notifyAdmins(
            type: Notification::TYPE_APPOINTMENT_NEW,
            title: 'New Appointment',
            message: sprintf(
                '%s booked %s with %s.',
                $appointment->customer?->name ?? 'A customer',
                $appointment->service?->name ?? 'a service',
                $appointment->barber?->user?->name ?? 'a barber'
            ),
            notifiable: $appointment,
            data: $data,
        );

        if ($barberUserId = $appointment->barber?->user_id) {
            $this->notifyUsers(
                [$barberUserId],
                type: Notification::TYPE_APPOINTMENT_NEW,
                title: 'New Appointment',
                message: sprintf(
                    '%s booked %s with you on %s at %s.',
                    $appointment->customer?->name ?? 'A customer',
                    $appointment->service?->name ?? 'a service',
                    optional($appointment->appointment_date)->format('M j, Y'),
                    substr((string) $appointment->start_time, 0, 5)
                ),
                notifiable: $appointment,
                data: $data,
            );
        }

        if ($customerUserId = $appointment->customer_id) {
            $this->notifyUsers(
                [$customerUserId],
                type: Notification::TYPE_APPOINTMENT_NEW,
                title: 'New Appointment',
                message: sprintf(
                    'Your booking for %s with %s on %s at %s has been received. Reference: %s.',
                    $appointment->service?->name ?? 'a service',
                    $appointment->barber?->user?->name ?? 'a barber',
                    optional($appointment->appointment_date)->format('M j, Y'),
                    substr((string) $appointment->start_time, 0, 5),
                    $appointment->booking_reference
                ),
                notifiable: $appointment,
                data: $data,
            );
        }
    }

    /**
     * Appointment status changed to confirmed/cancelled/completed/no_show.
     * (Ignores transitions into 'pending', which is the initial state
     * handled by appointmentCreated() instead.)
     *
     * Notifies admins and the assigned barber. If the barber themselves
     * made the change (e.g. via the Barber Portal), they're skipped so
     * they don't get notified about their own action.
     */
    public function appointmentStatusChanged(Appointment $appointment): void
    {
        $map = [
            'confirmed' => [Notification::TYPE_APPOINTMENT_CONFIRMED, 'Appointment Confirmed', 'confirmed'],
            'cancelled' => [Notification::TYPE_APPOINTMENT_CANCELLED, 'Appointment Cancelled', 'cancelled'],
            'completed' => [Notification::TYPE_APPOINTMENT_COMPLETED, 'Appointment Completed', 'completed'],
            'no_show' => [Notification::TYPE_APPOINTMENT_NO_SHOW, 'Appointment No-Show', 'marked as a no-show'],
        ];

        if (! isset($map[$appointment->status])) {
            return;
        }

        [$type, $title, $verb] = $map[$appointment->status];

        $appointment->loadMissing(['customer', 'barber.user', 'service']);
        $data = $this->appointmentData($appointment);

        $this->notifyAdmins(
            type: $type,
            title: $title,
            message: sprintf(
                'Booking %s for %s was %s.',
                $appointment->booking_reference,
                $appointment->customer?->name ?? 'a customer',
                $verb
            ),
            notifiable: $appointment,
            data: $data,
        );

        $barberUserId = $appointment->barber?->user_id;
        $actorUserId = auth()->id();

        if ($barberUserId && $barberUserId !== $actorUserId) {
            $this->notifyUsers(
                [$barberUserId],
                type: $type,
                title: $title,
                message: sprintf(
                    'Booking %s with %s was %s.',
                    $appointment->booking_reference,
                    $appointment->customer?->name ?? 'a customer',
                    $verb
                ),
                notifiable: $appointment,
                data: $data,
            );
        }

        if ($customerUserId = $appointment->customer_id) {
            $this->notifyUsers(
                [$customerUserId],
                type: $type,
                title: $title,
                message: sprintf(
                    'Your appointment %s for %s was %s.',
                    $appointment->booking_reference,
                    $appointment->service?->name ?? 'a service',
                    $verb
                ),
                notifiable: $appointment,
                data: $data,
            );
        }
    }

    /**
     * Payment status changed to paid/failed/refunded. (Ignores 'pending',
     * which is the default status set at appointment creation time.)
     */
    public function paymentStatusChanged(Payment $payment): void
    {
        $map = [
            'paid' => [Notification::TYPE_PAYMENT_PAID, 'Payment Received', 'received'],
            'failed' => [Notification::TYPE_PAYMENT_FAILED, 'Payment Failed', 'failed'],
            'refunded' => [Notification::TYPE_PAYMENT_REFUNDED, 'Payment Refunded', 'refunded'],
        ];

        if (! isset($map[$payment->status])) {
            return;
        }

        [$type, $title, $verb] = $map[$payment->status];

        $payment->loadMissing(['appointment.customer']);
        $appointment = $payment->appointment;

        $data = $this->paymentData($payment);

        $this->notifyAdmins(
            type: $type,
            title: $title,
            message: sprintf(
                'Payment of %s for booking %s was %s.',
                number_format((float) $payment->amount, 2),
                $appointment?->booking_reference ?? '—',
                $verb
            ),
            notifiable: $payment,
            data: $data,
        );

        if ($customerUserId = $appointment?->customer_id) {
            $this->notifyUsers(
                [$customerUserId],
                type: $type,
                title: $title,
                message: sprintf(
                    'Your payment of %s for booking %s was %s.',
                    number_format((float) $payment->amount, 2),
                    $appointment->booking_reference,
                    $verb
                ),
                notifiable: $payment,
                data: $data,
            );
        }
    }

    /**
     * A new customer account was created.
     */
    public function customerRegistered(User $customer): void
    {
        $this->notifyAdmins(
            type: Notification::TYPE_CUSTOMER_NEW,
            title: 'New Customer Registration',
            message: sprintf('%s created a customer account.', $customer->name),
            notifiable: $customer,
            data: [
                'customer_id' => $customer->id,
                'customer_name' => $customer->name,
                'customer_email' => $customer->email,
                'registered_at' => optional($customer->created_at)->toDateTimeString(),
            ],
        );
    }

    /**
     * Admin updated a barber's weekly schedule. Lets the barber know their
     * working hours changed without them having to notice on their own.
     */
    public function barberScheduleUpdated(Barber $barber): void
    {
        if (! $barber->user_id) {
            return;
        }

        $this->notifyUsers(
            [$barber->user_id],
            type: Notification::TYPE_SCHEDULE_UPDATED,
            title: 'Schedule Updated',
            message: 'Your work schedule has been updated by the shop admin.',
            notifiable: $barber,
            data: ['barber_id' => $barber->id],
        );
    }

    private function appointmentData(Appointment $appointment): array
    {
        return [
            'appointment_id' => $appointment->id,
            'booking_reference' => $appointment->booking_reference,
            'customer_id' => $appointment->customer_id,
            'customer_name' => $appointment->customer?->name,
            'service_name' => $appointment->service?->name,
            'barber_name' => $appointment->barber?->user?->name,
            'appointment_date' => optional($appointment->appointment_date)->toDateString(),
            'start_time' => substr((string) $appointment->start_time, 0, 5),
            'status' => $appointment->status,
        ];
    }

    private function paymentData(Payment $payment): array
    {
        $appointment = $payment->appointment;

        return [
            'payment_id' => $payment->id,
            'appointment_id' => $payment->appointment_id,
            'booking_reference' => $appointment?->booking_reference,
            'customer_id' => $appointment?->customer_id,
            'customer_name' => $appointment?->customer?->name,
            'amount' => (float) $payment->amount,
            'method' => $payment->method,
            'status' => $payment->status,
            'transaction_reference' => $payment->transaction_reference,
        ];
    }

    /**
     * Fan the event out to every admin user in a single bulk insert.
     */
    private function notifyAdmins(string $type, string $title, string $message, $notifiable, array $data): void
    {
        $adminIds = User::where('role', User::ROLE_ADMIN)->pluck('id');

        $this->notifyUsers($adminIds, $type, $title, $message, $notifiable, $data);
    }

    /**
     * Fan the event out to an arbitrary set of users in a single bulk
     * insert. Shared by notifyAdmins() and the barber-facing notification
     * paths above - one Notification row per recipient, same table, same
     * shape, just a different recipient list.
     */
    private function notifyUsers($userIds, string $type, string $title, string $message, $notifiable, array $data): void
    {
        $userIds = collect($userIds)->filter()->unique()->values();

        if ($userIds->isEmpty()) {
            return;
        }

        $now = now();

        $rows = $userIds->map(fn ($userId) => [
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => json_encode($data),
            'is_read' => false,
            'notifiable_type' => $notifiable::class,
            'notifiable_id' => $notifiable->getKey(),
            'created_at' => $now,
            'updated_at' => $now,
        ])->all();

        DB::table('notifications')->insert($rows);
    }
}
