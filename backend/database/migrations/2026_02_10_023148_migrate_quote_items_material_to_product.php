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
        Schema::table('quote_items', function (Blueprint $table) {
            // Add new columns for price list integration
            if (! Schema::hasColumn('quote_items', 'price_list_item_id')) {
                $table->foreignId('price_list_item_id')
                    ->nullable()
                    ->after('product_id')
                    ->constrained('price_list_items')
                    ->nullOnDelete()
                    ->comment('Reference to price list item if quote was generated from price list');
            }

            // VAT/IVA management
            if (! Schema::hasColumn('quote_items', 'vat_rate')) {
                $table->decimal('vat_rate', 5, 2)
                    ->nullable()
                    ->after('total')
                    ->comment('Aliquota IVA in percentuale (es. 22.00)');
            }

            if (! Schema::hasColumn('quote_items', 'vat_amount')) {
                $table->decimal('vat_amount', 12, 2)
                    ->default(0)
                    ->after('vat_rate')
                    ->comment('Importo IVA calcolato');
            }

            if (! Schema::hasColumn('quote_items', 'total_with_vat')) {
                $table->decimal('total_with_vat', 12, 2)
                    ->default(0)
                    ->after('vat_amount')
                    ->comment('Totale comprensivo di IVA');
            }

            // Product image display option
            if (! Schema::hasColumn('quote_items', 'include_image')) {
                $table->boolean('include_image')
                    ->default(false)
                    ->after('total_with_vat')
                    ->comment('Se mostrare immagine prodotto nel preventivo');
            }

            // Indexes
            $table->index('price_list_item_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['price_list_item_id']);

            // Drop columns
            $table->dropColumn([
                'price_list_item_id',
                'vat_rate',
                'vat_amount',
                'total_with_vat',
                'include_image',
            ]);
        });
    }
};
