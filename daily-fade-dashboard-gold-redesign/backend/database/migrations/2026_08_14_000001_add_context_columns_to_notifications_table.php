<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 6H: Admin Notifications.
 *
 * The notifications table (created in Phase 3, unused until now) already
 * has user_id/type/title/message/is_read. This adds:
 *   - notifiable_type / notifiable_id: polymorphic pointer to the related
 *     Appointment, Payment, or User (customer) record, if any.
 *   - data: a small JSON snapshot (booking reference, customer name,
 *     amount, etc.) so the notification list/detail can render without
 *     re-joining the related record every time, and keeps working even if
 *     the related record is later changed.
 *
 * Purely additive - no existing data is touched.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->nullableMorphs('notifiable');
            $table->json('data')->nullable()->after('message');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->dropMorphs('notifiable');
            $table->dropColumn('data');
        });
    }
};
