<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Create product_unit_types table for standardized units of measure
     * with Italian and English translations.
     */
    public function up(): void
    {
        Schema::create('product_unit_types', function (Blueprint $table) {
            $table->id();

            // Standard code (pz, mt, kg)
            $table->string('code', 10)
                ->unique()
                ->comment('Standard code: pz, mt, kg');

            // Italian translation
            $table->string('name_it', 50)
                ->comment('Italian name: Pezzo, Metro');

            $table->string('symbol_it', 10)
                ->comment('Italian symbol: pz, mt');

            // English translation
            $table->string('name_en', 50)
                ->comment('English name: Piece, Meter');

            $table->string('symbol_en', 10)
                ->comment('English symbol: pce, m');

            // Aliases and categorization
            $table->json('aliases')
                ->nullable()
                ->comment('Accepted variants: ["pezzo","piece","pce","pc"]');

            $table->string('category', 20)
                ->nullable()
                ->comment('count, length, weight, area, volume, time');

            $table->decimal('conversion_factor', 10, 4)
                ->nullable();

            // Status
            $table->boolean('is_active')->default(true);
            $table->integer('sort_order')->default(0);

            $table->timestamps();

            // Indexes
            $table->index(['category', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_unit_types');
    }
};
