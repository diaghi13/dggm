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
            $table->decimal('subrental_quoted_price', 10, 2)->nullable()->after('subrental_supplier_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_materials', function (Blueprint $table) {
            $table->dropColumn('subrental_quoted_price');
        });
    }
};
