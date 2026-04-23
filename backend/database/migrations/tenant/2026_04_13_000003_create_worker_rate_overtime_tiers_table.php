<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_rate_overtime_tiers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worker_rate_id')->constrained('worker_rates')->cascadeOnDelete();
            $table->decimal('hours_from', 5, 2)->default(0);
            $table->decimal('hours_to', 5, 2)->nullable()->comment('null = no upper limit');
            $table->decimal('multiplier', 5, 2)->nullable()->comment('e.g. 1.5, 2.0');
            $table->decimal('direct_rate', 10, 2)->nullable()->comment('fixed hourly rate override');
            $table->string('label')->nullable()->comment('e.g. Ordinario, Straordinario, Doppio');
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_rate_overtime_tiers');
    }
};
