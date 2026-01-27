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
        Schema::table('products', function (Blueprint $table) {
            // drop column category if exists
            if (Schema::hasColumn('products', 'category')) {
                $table->dropIndex('materials_category_index');
                $table->dropColumn('category');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            // add column category back
            $table->string('category')->nullable()->after('is_active');
            $table->index('category', 'materials_category_index');
        });
    }
};
