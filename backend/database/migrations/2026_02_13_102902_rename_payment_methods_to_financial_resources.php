<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::rename('payment_methods', 'financial_resources');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::rename('financial_resources', 'payment_methods');
    }
};
