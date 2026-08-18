<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\Payment;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    private const PAYMENT_METHODS = ['cash', 'gcash', 'maya'];

    /**
     * Admin: reports dashboard data for a given date range (today / week /
     * month / custom). Everything is computed live from the database.
     */
    public function index(Request $request)
    {
        $validated = $request->validate([
            'range' => ['nullable', Rule::in(['today', 'week', 'month', 'custom'])],
            'start_date' => ['nullable', 'date', 'required_if:range,custom'],
            'end_date' => ['nullable', 'date', 'required_if:range,custom', 'after_or_equal:start_date'],
        ]);

        [$start, $end, $label] = $this->resolveRange($validated);
        $startDate = $start->toDateString();
        $endDate = $end->toDateString();

        $appointmentsInRange = fn() => $this->scopeDateRange(Appointment::query(), $startDate, $endDate);
        $paidPaymentsInRange = fn() => $this->scopeDateRange(
            Payment::where('status', 'paid'),
            $startDate,
            $endDate,
            viaAppointment: true
        );

        $revenueTrend = $this->scopeDateRange(
            Payment::select(DB::raw('DATE(appointments.appointment_date) as date'), DB::raw('COALESCE(SUM(payments.amount), 0) as revenue'))
                ->join('appointments', 'appointments.id', '=', 'payments.appointment_id')
                ->where('payments.status', 'paid'),
            $startDate,
            $endDate,
            dateColumn: 'appointments.appointment_date'
        )
            ->groupBy(DB::raw('DATE(appointments.appointment_date)'))
            ->orderBy(DB::raw('DATE(appointments.appointment_date)'))
            ->get()
            ->map(fn($row) => ['date' => (string) $row->date, 'revenue' => (float) $row->revenue]);

        $appointmentTrend = $this->scopeDateRange(
            Appointment::select(DB::raw('DATE(appointment_date) as date'), DB::raw('COUNT(*) as total')),
            $startDate,
            $endDate
        )
            ->groupBy(DB::raw('DATE(appointment_date)'))
            ->orderBy(DB::raw('DATE(appointment_date)'))
            ->get()
            ->map(fn($row) => ['date' => (string) $row->date, 'total' => (int) $row->total]);

        $topServices = $this->scopeDateRange(
            Appointment::select('service_id', DB::raw('COUNT(*) as bookings')),
            $startDate,
            $endDate
        )
            ->groupBy('service_id')
            ->orderByDesc('bookings')
            ->with('service:id,name')
            ->limit(5)
            ->get()
            ->map(fn($row) => ['service' => $row->service?->name, 'bookings' => (int) $row->bookings]);

        $topBarbers = $this->scopeDateRange(
            Appointment::select('barber_id', DB::raw('COUNT(*) as bookings')),
            $startDate,
            $endDate
        )
            ->groupBy('barber_id')
            ->orderByDesc('bookings')
            ->with('barber.user:id,name')
            ->limit(5)
            ->get()
            ->map(fn($row) => ['barber' => $row->barber?->user?->name, 'bookings' => (int) $row->bookings]);

        $paymentBreakdownRows = $this->scopeDateRange(
            Payment::select('method', DB::raw('COUNT(*) as count'), DB::raw('COALESCE(SUM(amount), 0) as total'))
                ->where('status', 'paid'),
            $startDate,
            $endDate,
            viaAppointment: true
        )
            ->groupBy('method')
            ->get()
            ->keyBy('method');

        $paymentBreakdown = [];
        foreach (self::PAYMENT_METHODS as $method) {
            $row = $paymentBreakdownRows->get($method);
            $paymentBreakdown[$method] = [
                'count' => (int) ($row->count ?? 0),
                'total' => (float) ($row->total ?? 0),
            ];
        }

        $recentTransactions = $this->scopeDateRange(
            Payment::with(['appointment.customer', 'appointment.service'])->where('status', 'paid'),
            $startDate,
            $endDate,
            viaAppointment: true
        )
            ->orderByDesc('paid_at')
            ->limit(10)
            ->get()
            ->map(fn($payment) => [
                'id' => $payment->id,
                'booking_reference' => $payment->appointment->booking_reference ?? null,
                'customer' => $payment->appointment->customer->name ?? null,
                'service' => $payment->appointment->service->name ?? null,
                'amount' => (float) $payment->amount,
                'method' => $payment->method,
                'paid_at' => optional($payment->paid_at)->toDateTimeString(),
            ]);

        return response()->json([
            'success' => true,
            'data' => [
                'range' => [
                    'label' => $label,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                ],
                'total_revenue' => (float) $paidPaymentsInRange()->sum('amount'),
                'total_appointments' => $appointmentsInRange()->count(),
                'completed_appointments' => $appointmentsInRange()->where('status', 'completed')->count(),
                'confirmed_appointments' => $appointmentsInRange()->where('status', 'confirmed')->count(),
                'pending_appointments' => $appointmentsInRange()->where('status', 'pending')->count(),
                'cancelled_appointments' => $appointmentsInRange()->where('status', 'cancelled')->count(),
                'revenue_trend' => $revenueTrend,
                'appointment_trend' => $appointmentTrend,
                'top_services' => $topServices,
                'top_barbers' => $topBarbers,
                'payment_breakdown' => $paymentBreakdown,
                'recent_transactions' => $recentTransactions,
            ],
        ]);
    }

    /**
     * Applies a start/end date filter using whereDate() (not a raw string
     * whereBetween) so it works whether the underlying date column stores a
     * bare date or a full datetime — SQLite persists `appointment_date` as
     * "YYYY-MM-DD 00:00:00", which a plain string comparison would mishandle
     * at the range boundaries.
     */
    private function scopeDateRange(
        Builder $query,
        string $startDate,
        string $endDate,
        bool $viaAppointment = false,
        ?string $dateColumn = null
    ): Builder {
        if ($viaAppointment) {
            return $query->whereHas('appointment', function ($q) use ($startDate, $endDate) {
                $q->whereDate('appointment_date', '>=', $startDate)
                    ->whereDate('appointment_date', '<=', $endDate);
            });
        }

        $column = $dateColumn ?? 'appointment_date';

        return $query
            ->whereDate($column, '>=', $startDate)
            ->whereDate($column, '<=', $endDate);
    }

    /**
     * The app's PHP default timezone is UTC (config/app.php), but the
     * business operates in the Philippines. Without anchoring explicitly to
     * Asia/Manila here, Carbon::today()/now() resolve "today" in UTC, which
     * lags the real Manila calendar date by up to 8 hours (Manila 12am-8am
     * is still "yesterday" in UTC) — causing Today/This Week/This Month to
     * silently filter against the wrong day.
     */
    private const BUSINESS_TIMEZONE = 'Asia/Manila';

    private function resolveRange(array $validated): array
    {
        $range = $validated['range'] ?? 'today';
        $tz = self::BUSINESS_TIMEZONE;

        return match ($range) {
            'week' => [Carbon::now($tz)->startOfWeek(), Carbon::now($tz)->endOfWeek(), 'This Week'],
            'month' => [Carbon::now($tz)->startOfMonth(), Carbon::now($tz)->endOfMonth(), 'This Month'],
            'custom' => [
                Carbon::parse($validated['start_date'], $tz),
                Carbon::parse($validated['end_date'], $tz),
                'Custom Range',
            ],
            default => [Carbon::today($tz), Carbon::today($tz), 'Today'],
        };
    }
}