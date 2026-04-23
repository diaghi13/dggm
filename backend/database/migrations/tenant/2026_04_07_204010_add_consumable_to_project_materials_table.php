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
        Schema::table('project_materials', function (Blueprint $table) {
            $table->boolean('is_consumable')->default(false)->after('kit_assembly_id');
            $table->boolean('include_in_final_balance')->default(true)->after('is_consumable');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_materials', function (Blueprint $table) {
            $table->dropColumn(['is_consumable', 'include_in_final_balance']);
        });
    }
};
