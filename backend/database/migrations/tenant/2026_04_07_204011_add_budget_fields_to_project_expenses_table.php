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
        Schema::table('project_expenses', function (Blueprint $table) {
            $table->boolean('is_budgeted')->default(false)->after('notes');
            $table->decimal('budgeted_amount', 10, 2)->nullable()->after('is_budgeted');
            $table->boolean('billable_to_final_balance')->default(false)->after('budgeted_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_expenses', function (Blueprint $table) {
            $table->dropColumn(['is_budgeted', 'budgeted_amount', 'billable_to_final_balance']);
        });
    }
};
