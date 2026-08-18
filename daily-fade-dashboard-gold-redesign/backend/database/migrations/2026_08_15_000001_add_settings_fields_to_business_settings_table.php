<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 6I: extends the existing business_settings table (created in
     * Phase 1) rather than creating a second settings system. Adds:
     * - website (Business Information)
     * - business_hours (Business Hours — shop-level, separate from the
     *   per-barber schedules in barber_schedules)
     * - booking configuration (Booking Settings)
     * - payment method toggles (Payment Settings)
     */
    public function up(): void
    {
        Schema::table('business_settings', function (Blueprint $table) {
            $table->string('website')->nullable()->after('address');

            // Business hours: JSON array of 7 days, e.g.
            // [{"day_of_week":0,"day_name":"Sunday","is_open":false,"open_time":"09:00","close_time":"19:00"}, ...]
            $table->json('business_hours')->nullable()->after('currency');

            // Booking settings
            $table->unsignedInteger('min_booking_notice_minutes')->default(30)->after('business_hours');
            $table->unsignedInteger('max_advance_booking_days')->default(30)->after('min_booking_notice_minutes');
            $table->boolean('online_booking_enabled')->default(true)->after('max_advance_booking_days');
            $table->string('default_appointment_status')->default('pending')->after('online_booking_enabled');

            // Payment method toggles
            $table->boolean('payment_cash_enabled')->default(true)->after('default_appointment_status');
            $table->boolean('payment_gcash_enabled')->default(true)->after('payment_cash_enabled');
            $table->boolean('payment_maya_enabled')->default(true)->after('payment_gcash_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('business_settings', function (Blueprint $table) {
            $table->dropColumn([
                'website',
                'business_hours',
                'min_booking_notice_minutes',
                'max_advance_booking_days',
                'online_booking_enabled',
                'default_appointment_status',
                'payment_cash_enabled',
                'payment_gcash_enabled',
                'payment_maya_enabled',
            ]);
        });
    }
};
