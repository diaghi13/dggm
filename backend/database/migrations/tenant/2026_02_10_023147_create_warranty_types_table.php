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
        Schema::create('warranty_types', function (Blueprint $table) {
            $table->id();

            // Warranty details
            $table->string('name'); // "2 anni materiali e installazione"
            $table->integer('years')->nullable()->comment('Durata in anni (NULL = illimitata)');
            $table->text('description')->nullable();
            $table->json('exclusions')->nullable()->comment('Array di esclusioni dalla garanzia');

            // Configuration
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            // Indexes
            $table->index('is_default');
            $table->index('is_active');
            $table->index(['is_active', 'sort_order']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warranty_types');
    }
};
