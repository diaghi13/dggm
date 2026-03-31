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
        Schema::table('materials', function (Blueprint $table) {
            // Product type: physical (inventoriabile), service (non inventoriabile), kit (composto)
            $table->string('product_type')->default('physical')->after('category'); // physical, service, kit

            // Pricing - Acquisto
            $table->decimal('purchase_price', 10, 2)->default(0)->after('standard_cost'); // Prezzo acquisto

            // Pricing - Vendita
            $table->decimal('markup_percentage', 5, 2)->default(0)->after('purchase_price'); // Ricarico %
            $table->decimal('sale_price', 10, 2)->default(0)->after('markup_percentage'); // Prezzo vendita (calcolato o manuale)

            // Pricing - Noleggio
            $table->decimal('rental_price_daily', 10, 2)->default(0)->after('sale_price'); // Prezzo noleggio giornaliero
            $table->decimal('rental_price_weekly', 10, 2)->default(0)->after('rental_price_daily'); // Prezzo noleggio settimanale
            $table->decimal('rental_price_monthly', 10, 2)->default(0)->after('rental_price_weekly'); // Prezzo noleggio mensile

            // Kit/Composition
            $table->boolean('is_kit')->default(false)->after('product_type'); // True se è un kit/composizione

            // Rental tracking
            $table->boolean('is_rentable')->default(false)->after('is_kit'); // True se noleggiabile
            $table->integer('quantity_out_on_rental')->default(0)->after('is_rentable'); // Quantità attualmente in noleggio
        });

        // Tabella per composizione kit
        Schema::create('material_components', function (Blueprint $table) {
            $table->id();
            $table->foreignId('kit_material_id')->constrained('materials')->cascadeOnDelete(); // Il kit
            $table->foreignId('component_material_id')->constrained('materials')->cascadeOnDelete(); // Il componente
            $table->decimal('quantity', 10, 2)->default(1); // Quantità del componente nel kit
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['kit_material_id', 'component_material_id']);
            $table->index('kit_material_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_components');

        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn([
                'product_type',
                'is_kit',
                'is_rentable',
                'quantity_out_on_rental',
                'purchase_price',
                'markup_percentage',
                'sale_price',
                'rental_price_daily',
                'rental_price_weekly',
                'rental_price_monthly',
            ]);
        });
    }
};
