<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('project_materials', function (Blueprint $table) {
            $table->dropForeign(['subrental_supplier_id']);
            $table->dropColumn(['subrental_supplier_id', 'subrental_quoted_price']);
            $table->json('subrental_assignments')->nullable()->after('is_rental');
        });
    }

    public function down(): void
    {
        Schema::table('project_materials', function (Blueprint $table) {
            $table->dropColumn('subrental_assignments');
            $table->foreignId('subrental_supplier_id')->nullable()->constrained('product_subrental_suppliers')->nullOnDelete()->after('is_rental');
            $table->decimal('subrental_quoted_price', 10, 2)->nullable()->after('subrental_supplier_id');
        });
    }
};
