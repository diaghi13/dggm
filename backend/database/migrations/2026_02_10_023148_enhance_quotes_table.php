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
        Schema::table('quotes', function (Blueprint $table) {
            // Price list association
            if (! Schema::hasColumn('quotes', 'price_list_id')) {
                $table->foreignId('price_list_id')
                    ->nullable()
                    ->after('project_manager_id')
                    ->constrained('price_lists')
                    ->nullOnDelete();
            }

            // Payment terms (replacing legacy string fields)
            if (! Schema::hasColumn('quotes', 'payment_term_id')) {
                $table->foreignId('payment_term_id')
                    ->nullable()
                    ->after('price_list_id')
                    ->constrained('payment_terms')
                    ->nullOnDelete();
            }

            // Deposit/Advance payment
            if (! Schema::hasColumn('quotes', 'deposit_percentage')) {
                $table->decimal('deposit_percentage', 5, 2)
                    ->nullable()
                    ->after('payment_term_id')
                    ->comment('Percentuale acconto');
            }

            if (! Schema::hasColumn('quotes', 'deposit_amount')) {
                $table->decimal('deposit_amount', 12, 2)
                    ->nullable()
                    ->after('deposit_percentage')
                    ->comment('Importo acconto fisso');
            }

            // Work timeline
            if (! Schema::hasColumn('quotes', 'work_start_description')) {
                $table->text('work_start_description')
                    ->nullable()
                    ->after('deposit_amount')
                    ->comment('Descrizione testuale inizio lavori');
            }

            if (! Schema::hasColumn('quotes', 'work_start_date')) {
                $table->date('work_start_date')
                    ->nullable()
                    ->after('work_start_description');
            }

            if (! Schema::hasColumn('quotes', 'work_duration_description')) {
                $table->text('work_duration_description')
                    ->nullable()
                    ->after('work_start_date')
                    ->comment('Descrizione testuale durata lavori');
            }

            if (! Schema::hasColumn('quotes', 'work_end_date')) {
                $table->date('work_end_date')
                    ->nullable()
                    ->after('work_duration_description');
            }

            // Warranty
            if (! Schema::hasColumn('quotes', 'warranty_type_id')) {
                $table->foreignId('warranty_type_id')
                    ->nullable()
                    ->after('work_end_date')
                    ->constrained('warranty_types')
                    ->nullOnDelete();
            }

            // Display options
            if (! Schema::hasColumn('quotes', 'show_product_codes')) {
                $table->boolean('show_product_codes')
                    ->default(true)
                    ->after('warranty_type_id');
            }

            if (! Schema::hasColumn('quotes', 'show_vat')) {
                $table->boolean('show_vat')
                    ->default(true)
                    ->after('show_product_codes');
            }

            if (! Schema::hasColumn('quotes', 'vat_included_in_prices')) {
                $table->boolean('vat_included_in_prices')
                    ->default(false)
                    ->after('show_vat')
                    ->comment('Se true, i prezzi visualizzati includono IVA');
            }

            if (! Schema::hasColumn('quotes', 'include_terms_and_conditions')) {
                $table->boolean('include_terms_and_conditions')
                    ->default(true)
                    ->after('vat_included_in_prices');
            }

            // Indexes
            $table->index('price_list_id');
            $table->index('payment_term_id');
            $table->index('warranty_type_id');
            $table->index('work_start_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            // Drop foreign keys first
            $table->dropForeign(['price_list_id']);
            $table->dropForeign(['payment_term_id']);
            $table->dropForeign(['warranty_type_id']);

            // Drop columns
            $table->dropColumn([
                'price_list_id',
                'payment_term_id',
                'deposit_percentage',
                'deposit_amount',
                'work_start_description',
                'work_start_date',
                'work_duration_description',
                'work_end_date',
                'warranty_type_id',
                'show_product_codes',
                'show_vat',
                'vat_included_in_prices',
                'include_terms_and_conditions',
            ]);
        });
    }
};
