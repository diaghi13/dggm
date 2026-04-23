<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rental_return_inspections', function (Blueprint $table) {
            $table->id();
            $table->foreignId('ddt_id')->constrained('ddts')->cascadeOnDelete();
            $table->foreignId('project_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('inspected_by_user_id')->constrained('users');
            $table->date('inspection_date');
            $table->enum('status', ['in_progress', 'completed'])->default('in_progress');
            $table->text('overall_notes')->nullable();
            $table->timestamps();
            $table->softDeletes();
            $table->unique('ddt_id'); // one inspection per DDT
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rental_return_inspections');
    }
};
