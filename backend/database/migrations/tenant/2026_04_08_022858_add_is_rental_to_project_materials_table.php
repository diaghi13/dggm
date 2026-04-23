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
            $table->boolean('is_rental')->default(false)->after('kit_assembly_id');
            $table->foreignId('subrental_supplier_id')->nullable()->constrained('product_subrental_suppliers')->nullOnDelete()->after('is_rental');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('project_materials', function (Blueprint $table) {
            $table->dropForeign(['subrental_supplier_id']);
            $table->dropColumn(['is_rental', 'subrental_supplier_id']);
        });
    }
};
