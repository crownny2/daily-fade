<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('business_settings', function (Blueprint $table) {
            $table->id();
            $table->string('business_name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('address')->nullable();
            $table->string('timezone')->default('Asia/Manila');
            $table->string('currency')->default('PHP');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('business_settings');
    }
};
