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
        // Rename table
        Schema::rename('material_categories', 'product_categories');

        // Add new optional columns for UI
        Schema::table('product_categories', function (Blueprint $table) {
            $table->string('icon', 50)->nullable()->after('description')->comment('Icon name (lucide-react)');
            $table->string('color', 7)->nullable()->after('icon')->comment('HEX color for UI (#FF5733)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove added columns
        Schema::table('product_categories', function (Blueprint $table) {
            $table->dropColumn(['icon', 'color']);
        });

        // Rename back to original name
        Schema::rename('product_categories', 'material_categories');
    }
};
