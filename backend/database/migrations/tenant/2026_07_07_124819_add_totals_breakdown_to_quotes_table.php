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
        Schema::table('quotes', function (Blueprint $table): void {
            $table->decimal('gross_total', 12, 2)->default(0)->after('subtotal');
            $table->decimal('items_discount', 12, 2)->default(0)->after('gross_total');
            $table->decimal('taxable_amount', 12, 2)->default(0)->after('items_discount');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table): void {
            $table->dropColumn(['gross_total', 'items_discount', 'taxable_amount']);
        });
    }
};
