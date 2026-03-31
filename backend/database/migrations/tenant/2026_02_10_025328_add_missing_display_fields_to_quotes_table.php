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
            // Display options missing from base migration
            if (! Schema::hasColumn('quotes', 'show_tax')) {
                $table->boolean('show_tax')->default(true)->after('tax_amount');
            }

            if (! Schema::hasColumn('quotes', 'tax_included')) {
                $table->boolean('tax_included')->default(false)->after('show_tax');
            }

            if (! Schema::hasColumn('quotes', 'show_unit_prices')) {
                $table->boolean('show_unit_prices')->default(true)->after('tax_included');
            }

            // Payment terms - might not exist yet
            if (! Schema::hasColumn('quotes', 'payment_method')) {
                $table->string('payment_method')->nullable()->after('show_unit_prices');
            }

            if (! Schema::hasColumn('quotes', 'payment_terms')) {
                $table->text('payment_terms')->nullable()->after('payment_method');
            }

            // Template reference
            if (! Schema::hasColumn('quotes', 'template_id')) {
                $table->foreignId('template_id')->nullable()->constrained('quote_templates')->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropColumn([
                'show_tax',
                'tax_included',
                'show_unit_prices',
                'payment_method',
                'payment_terms',
            ]);

            if (Schema::hasColumn('quotes', 'template_id')) {
                $table->dropForeign(['template_id']);
                $table->dropColumn('template_id');
            }
        });
    }
};
