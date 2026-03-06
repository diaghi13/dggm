<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rental_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('sector');
            $table->decimal('exponent_curve', 5, 4)->default(0.69);
            $table->decimal('decay_strength', 5, 4)->default(0.27);
            $table->decimal('max_duration_reference', 8, 2)->default(30);
            $table->decimal('duration_offset', 5, 4)->default(0.15);
            $table->decimal('max_period_cap_days', 8, 2)->default(90);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rental_profiles');
    }
};
