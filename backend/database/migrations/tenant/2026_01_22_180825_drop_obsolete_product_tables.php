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
        // Drop product_components (replaced by product_relations)
        Schema::dropIfExists('product_components');

        // Drop material_dependencies (replaced by product_relations)
        Schema::dropIfExists('material_dependencies');

        // Drop material_dependency_types (never used)
        Schema::dropIfExists('material_dependency_types');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No rollback - these tables are obsolete
        // If you need to rollback, restore from backup
    }
};
