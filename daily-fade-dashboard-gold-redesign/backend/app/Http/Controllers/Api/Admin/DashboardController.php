<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Models\Barber;
use App\Models\Notification;
use App\Models\Payment;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index(\Illuminate\Http\Request $request)
    {
        // Anchored to the business timezone (Asia/Manila), not the server's
        // UTC default — see ReportController::BUSINESS_TIMEZONE for why.
        $today = Carbon::today('Asia/Manila');
        $weekStart = $today->copy()->startOfWeek();
        $weekEnd = $today->copy()->endOfWeek();
        $monthStart = $today->copy()->startOfMonth();

        $todaysRevenue = Payment::whereHas(
            'appointment',
            fn($q) => $q->whereDate('appointment_date', $today)
        )->where('status', 'paid')->sum('amount');

        $weekRevenue = Payment::whereHas(
            'appointment',
            fn($q) => $q->whereBetween('appointment_date', [$weekStart, $weekEnd])
        )->where('status', 'paid')->sum('amount');

        $monthRevenue = Payment::whereHas(
            'appointment',
            fn($q) => $q->whereDate('appointment_date', '>=', $monthStart)
        )->where('status', 'paid')->sum('amount');

        // A cancelled appointment's unpaid payment row is nothing owed to
        // the shop anymore - exclude it so cancelled bookings don't
        // inflate "pending payments" forever.
        $pendingPayments = Payment::where('status', 'pending')
            ->whereHas('appointment', fn($q) => $q->where('status', '!=', 'cancelled'))
            ->sum('amount');

        // Revenue trend: this week, Monday through Sunday.
        // Note: both `payments` and `appointments` have a `status` column, so
        // once they're joined every column must be table-qualified or SQLite
        // throws an "ambiguous column name" error.
        $revenueByDay = Payment::query()
            ->join('appointments', 'appointments.id', '=', 'payments.appointment_id')
            ->where('payments.status', 'paid')
            ->whereBetween('appointments.appointment_date', [$weekStart, $weekEnd])
            ->select('appointments.appointment_date as date', DB::raw('sum(payments.amount) as total'))
            ->groupBy('appointments.appointment_date')
            ->pluck('total', 'date');

        $revenueTrend = [];
        for ($d = $weekStart->copy(); $d->lte($weekEnd); $d->addDay()) {
            $key = $d->toDateString();
            $revenueTrend[] = [
                'date' => $key,
                'label' => $d->format('D'),
                'revenue' => (float) ($revenueByDay[$key] ?? 0),
            ];
        }

        $popularServices = Appointment::select('service_id', DB::raw('count(*) as total'))
            ->groupBy('service_id')
            ->orderByDesc('total')
            ->with('service:id,name')
            ->limit(5)
            ->get();

        $topBarbers = Appointment::select('barber_id', DB::raw('count(*) as total'))
            ->groupBy('barber_id')
            ->orderByDesc('total')
            ->with('barber.user:id,name')
            ->limit(5)
            ->get();

        $barberRevenue = Payment::query()
            ->join('appointments', 'appointments.id', '=', 'payments.appointment_id')
            ->where('payments.status', 'paid')
            ->select('appointments.barber_id', DB::raw('sum(payments.amount) as total'))
            ->groupBy('appointments.barber_id')
            ->pluck('total', 'barber_id');

        $recentActivities = Notification::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->limit(6)
            ->get(['id', 'type', 'title', 'message', 'created_at']);

        return response()->json([
            'success' => true,
            'data' => [
                // Phase 6A: overall totals for the dashboard stat cards.
                'total_appointments' => Appointment::count(),
                'total_barbers' => Barber::count(),
                'total_services' => Service::count(),

                'today_appointments_count' => Appointment::whereDate('appointment_date', $today)->count(),
                'pending_appointments' => Appointment::where('status', 'pending')->count(),
                'confirmed_appointments' => Appointment::where('status', 'confirmed')->count(),
                'completed_appointments' => Appointment::where('status', 'completed')->count(),
                'cancelled_appointments' => Appointment::where('status', 'cancelled')->count(),
                'todays_revenue' => (float) $todaysRevenue,
                'total_customers' => User::where('role', User::ROLE_CUSTOMER)->count(),
                'active_barbers' => Barber::where('is_active', true)->count(),
                'active_services' => Service::where('is_active', true)->count(),
                'todays_appointments' => AppointmentResource::collection(
                    Appointment::whereDate('appointment_date', $today)
                        ->with(['customer', 'barber.user', 'service'])
                        ->orderBy('start_time')
                        ->get()
                ),
                'recent_appointments' => AppointmentResource::collection(
                    Appointment::with(['customer', 'barber.user', 'service'])
                        ->orderByDesc('created_at')
                        ->limit(10)
                        ->get()
                ),
                'upcoming_appointments' => AppointmentResource::collection(
                    Appointment::with(['customer', 'barber.user', 'service'])
                        ->whereDate('appointment_date', '>', $today)
                        ->whereIn('status', ['pending', 'confirmed'])
                        ->orderBy('appointment_date')
                        ->orderBy('start_time')
                        ->limit(8)
                        ->get()
                ),
                'popular_services' => $popularServices->map(fn($row) => [
                    'service' => $row->service?->name,
                    'bookings' => $row->total,
                ]),
                'top_barbers' => $topBarbers->map(fn($row) => [
                    'barber' => $row->barber?->user?->name,
                    'bookings' => $row->total,
                    'revenue' => (float) ($barberRevenue[$row->barber_id] ?? 0),
                ]),
                'revenue_trend' => $revenueTrend,
                'revenue_summary' => [
                    'today' => (float) $todaysRevenue,
                    'this_week' => (float) $weekRevenue,
                    'this_month' => (float) $monthRevenue,
                    'pending_payments' => (float) $pendingPayments,
                ],
                'recent_activities' => $recentActivities->map(fn($n) => [
                    'id' => $n->id,
                    'type' => $n->type,
                    'title' => $n->title,
                    'message' => $n->message,
                    'created_at' => $n->created_at,
                ]),
            ],
        ]);
    }
}