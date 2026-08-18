<?php

use App\Http\Controllers\Api\Admin\AppointmentController as AdminAppointmentController;
use App\Http\Controllers\Api\Admin\BarberController as AdminBarberController;
use App\Http\Controllers\Api\Admin\BarberScheduleController as AdminBarberScheduleController;
use App\Http\Controllers\Api\Admin\CustomerController as AdminCustomerController;
use App\Http\Controllers\Api\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\Admin\NotificationController as AdminNotificationController;
use App\Http\Controllers\Api\Admin\PaymentController as AdminPaymentController;
use App\Http\Controllers\Api\Admin\ReportController as AdminReportController;
use App\Http\Controllers\Api\Admin\ServiceController as AdminServiceController;
use App\Http\Controllers\Api\Admin\SettingController as AdminSettingController;
use App\Http\Controllers\Api\Barber\AppointmentController as BarberAppointmentController;
use App\Http\Controllers\Api\Barber\DashboardController as BarberDashboardController;
use App\Http\Controllers\Api\Barber\NotificationController as BarberNotificationController;
use App\Http\Controllers\Api\Barber\ProfileController as BarberProfileController;
use App\Http\Controllers\Api\Barber\ScheduleController as BarberScheduleController;
use App\Http\Controllers\Api\Customer\NotificationController as CustomerNotificationController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\BarberController;
use App\Http\Controllers\Api\ServiceController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });
});

// Public: catalog data for the customer frontend (services, barbers pages,
// and the booking wizard). No auth required.
Route::get('/services', [ServiceController::class, 'index']);
Route::get('/barbers', [BarberController::class, 'index']);

// Public: checking a barber's availability does not require login.
Route::get('/barbers/{barber}/availability', [AvailabilityController::class, 'index']);

// Admin-only routes. Any customer or barber hitting these gets 403.
Route::prefix('admin')->middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::get('/ping', function () {
        return response()->json(['message' => 'Welcome, admin.']);
    });

    // --- Phase 3 additions ---
    Route::get('/appointments', [AdminAppointmentController::class, 'index']);
    Route::patch('/appointments/{appointment}/status', [AdminAppointmentController::class, 'updateStatus']);
    Route::get('/dashboard', [AdminDashboardController::class, 'index']);

    // --- Phase 6B/6C/6E additions ---
    Route::get('/services', [AdminServiceController::class, 'index']);
    Route::post('/services', [AdminServiceController::class, 'store']);
    Route::put('/services/{service}', [AdminServiceController::class, 'update']);
    Route::patch('/services/{service}/toggle-status', [AdminServiceController::class, 'toggleStatus']);
    Route::delete('/services/{service}', [AdminServiceController::class, 'destroy']);

    Route::get('/barber-schedules', [AdminBarberScheduleController::class, 'index']);
    Route::put('/barber-schedules/{barber}', [AdminBarberScheduleController::class, 'update']);

    // --- Phase 6D additions ---
    Route::get('/barbers', [AdminBarberController::class, 'index']);
    Route::post('/barbers', [AdminBarberController::class, 'store']);
    Route::get('/barbers/{barber}', [AdminBarberController::class, 'show']);
    Route::put('/barbers/{barber}', [AdminBarberController::class, 'update']);
    Route::patch('/barbers/{barber}/toggle-status', [AdminBarberController::class, 'toggleStatus']);

    // --- Phase 6F additions ---
    Route::get('/payments', [AdminPaymentController::class, 'index']);
    Route::get('/payments/{payment}', [AdminPaymentController::class, 'show']);
    Route::patch('/payments/{payment}/status', [AdminPaymentController::class, 'updateStatus']);

    // --- Phase 6G additions ---
    Route::get('/customers', [AdminCustomerController::class, 'index']);
    Route::get('/customers/{customer}', [AdminCustomerController::class, 'show']);
    Route::get('/reports', [AdminReportController::class, 'index']);

    // --- Phase 6H additions ---
    Route::get('/notifications', [AdminNotificationController::class, 'index']);
    Route::patch('/notifications/read-all', [AdminNotificationController::class, 'markAllRead']);
    Route::get('/notifications/{notification}', [AdminNotificationController::class, 'show']);
    Route::patch('/notifications/{notification}/read', [AdminNotificationController::class, 'markRead']);
    Route::patch('/notifications/{notification}/unread', [AdminNotificationController::class, 'markUnread']);
    Route::delete('/notifications/{notification}', [AdminNotificationController::class, 'destroy']);

    // --- Phase 6I additions ---
    Route::get('/settings', [AdminSettingController::class, 'index']);
    Route::put('/settings', [AdminSettingController::class, 'update']);
    Route::put('/profile', [AdminSettingController::class, 'updateProfile']);
});

// Barber-only routes.
Route::prefix('barber')->middleware(['auth:sanctum', 'role:barber'])->group(function () {
    Route::get('/ping', function () {
        return response()->json(['message' => 'Welcome, barber.']);
    });

    // --- Phase 7C-1 additions ---
    Route::get('/dashboard', [BarberDashboardController::class, 'index']);
    Route::get('/appointments', [BarberAppointmentController::class, 'index']);
    Route::get('/appointments/{appointment}', [BarberAppointmentController::class, 'show']);
    Route::patch('/appointments/{appointment}/status', [BarberAppointmentController::class, 'updateStatus']);

    // --- Phase 7C-2 additions ---
    Route::get('/schedule', [BarberScheduleController::class, 'index']);
    Route::get('/profile', [BarberProfileController::class, 'show']);
    Route::put('/profile', [BarberProfileController::class, 'update']);
    Route::get('/notifications', [BarberNotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [BarberNotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [BarberNotificationController::class, 'markAllRead']);
});

// Customer-only routes.
Route::prefix('customer')->middleware(['auth:sanctum', 'role:customer'])->group(function () {
    Route::get('/ping', function () {
        return response()->json(['message' => 'Welcome, customer.']);
    });

    // --- Phase 7D-2 additions ---
    Route::get('/notifications', [CustomerNotificationController::class, 'index']);
    Route::patch('/notifications/{notification}/read', [CustomerNotificationController::class, 'markRead']);
    Route::patch('/notifications/read-all', [CustomerNotificationController::class, 'markAllRead']);
});

// Phase 3: customer booking endpoints (not under /customer prefix — matches
// the flat /api/appointments, /api/my-appointments paths from the spec).
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/my-appointments', [AppointmentController::class, 'myAppointments']);
    Route::get('/my-appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::patch('/my-appointments/{appointment}/cancel', [AppointmentController::class, 'cancel']);
});
