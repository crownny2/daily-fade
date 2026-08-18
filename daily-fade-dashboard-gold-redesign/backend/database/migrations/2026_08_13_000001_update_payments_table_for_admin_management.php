<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phase 6F: Payment Management.
     *
     * The original payments table (Phase 3) supports method
     * cash|gcash|card and status pending|paid|refunded. This phase needs:
     *   - method:  cash|gcash|maya   ("card" is replaced by "maya")
     *   - status:  pending|paid|failed|refunded
     *   - transaction_reference (nullable) - for GCash/Maya reference numbers
     *   - notes (nullable) - free-text note recorded alongside a status change
     *
     * SQLite (the local dev default) bakes enum values into a CHECK
     * constraint at table-creation time and has no ALTER COLUMN support, so
     * on that driver the table is rebuilt. MySQL/Postgres are altered in
     * place.
     */
    public function up(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            Schema::create('payments_new', function (Blueprint $table) {
                $table->id();
                $table->foreignId('appointment_id')->constrained('appointments')->cascadeOnDelete();
                $table->decimal('amount', 8, 2);
                $table->enum('method', ['cash', 'gcash', 'maya'])->default('cash');
                $table->string('transaction_reference')->nullable();
                $table->enum('status', ['pending', 'paid', 'failed', 'refunded'])->default('pending');
                $table->timestamp('paid_at')->nullable();
                $table->text('notes')->nullable();
                $table->timestamps();
            });

            DB::statement("
                INSERT INTO payments_new (id, appointment_id, amount, method, status, paid_at, created_at, updated_at)
                SELECT id, appointment_id, amount,
                       CASE WHEN method = 'card' THEN 'maya' ELSE method END,
                       status, paid_at, created_at, updated_at
                FROM payments
            ");

            Schema::drop('payments');
            Schema::rename('payments_new', 'payments');

            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->string('transaction_reference')->nullable()->after('method');
            $table->text('notes')->nullable()->after('paid_at');
        });

        if ($driver === 'mysql') {
            DB::statement("UPDATE payments SET method = 'maya' WHERE method = 'card'");
            DB::statement("ALTER TABLE payments MODIFY method ENUM('cash','gcash','maya') NOT NULL DEFAULT 'cash'");
            DB::statement("ALTER TABLE payments MODIFY status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending'");
        } elseif ($driver === 'pgsql') {
            DB::statement("UPDATE payments SET method = 'maya' WHERE method = 'card'");
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (method IN ('cash','gcash','maya'))");
            DB::statement('ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check');
            DB::statement("ALTER TABLE payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending','paid','failed','refunded'))");
        }
    }

    public function down(): void
    {
        $driver = Schema::getConnection()->getDriverName();

        if ($driver === 'sqlite') {
            // Rebuilding back to the exact original (narrower) enum set is
            // intentionally not attempted - Phase 6F is meant to move
            // forward, not revert payment method/status support. The
            // additive columns are safe to leave in place.
            return;
        }

        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['transaction_reference', 'notes']);
        });
    }
};
