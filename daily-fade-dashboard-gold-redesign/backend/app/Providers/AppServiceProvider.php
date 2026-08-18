<?php

namespace App\Providers;

use App\Models\Appointment;
use App\Models\Payment;
use App\Models\User;
use App\Observers\AppointmentObserver;
use App\Observers\PaymentObserver;
use App\Observers\UserObserver;
use App\Policies\AppointmentPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Gate::policy(Appointment::class, AppointmentPolicy::class);

        // Phase 6H: admin notifications, driven off model events so every
        // path that creates/changes these records (admin actions and
        // customer self-service actions alike) produces a notification.
        Appointment::observe(AppointmentObserver::class);
        Payment::observe(PaymentObserver::class);
        User::observe(UserObserver::class);
    }
}