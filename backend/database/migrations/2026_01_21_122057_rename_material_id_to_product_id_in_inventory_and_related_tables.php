<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Rename material_id to product_id in inventory and related tables
     */
    public function up(): void
    {
        // Update inventory table
        if (Schema::hasTable('inventory') && Schema::hasColumn('inventory', 'material_id')) {
            Schema::table('inventory', function (Blueprint $table) {
                // Drop the old foreign key constraint
                $table->dropForeign(['material_id']);
                $table->dropUnique(['material_id', 'warehouse_id']);
                $table->dropIndex(['material_id', 'warehouse_id']);
            });

            // Rename the column
            Schema::table('inventory', function (Blueprint $table) {
                $table->renameColumn('material_id', 'product_id');
            });

            // Add new foreign key and indexes
            Schema::table('inventory', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
                $table->unique(['product_id', 'warehouse_id']);
                $table->index(['product_id', 'warehouse_id']);
            });
        }

        // Update stock_movements table if it has material_id
        if (Schema::hasTable('stock_movements') && Schema::hasColumn('stock_movements', 'material_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropForeign(['material_id']);
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->renameColumn('material_id', 'product_id');
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // Update site_materials table if it exists
        if (Schema::hasTable('site_materials') && Schema::hasColumn('site_materials', 'material_id')) {
            Schema::table('site_materials', function (Blueprint $table) {
                $table->dropForeign(['material_id']);
            });

            Schema::table('site_materials', function (Blueprint $table) {
                $table->renameColumn('material_id', 'product_id');
            });

            Schema::table('site_materials', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // Update quote_items table if it has material_id
        if (Schema::hasTable('quote_items') && Schema::hasColumn('quote_items', 'material_id')) {
            Schema::table('quote_items', function (Blueprint $table) {
                $table->dropForeign(['material_id']);
            });

            Schema::table('quote_items', function (Blueprint $table) {
                $table->renameColumn('material_id', 'product_id');
            });

            Schema::table('quote_items', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // Update ddt_items table if it has material_id
        if (Schema::hasTable('ddt_items') && Schema::hasColumn('ddt_items', 'material_id')) {
            Schema::table('ddt_items', function (Blueprint $table) {
                $table->dropForeign(['material_id']);
            });

            Schema::table('ddt_items', function (Blueprint $table) {
                $table->renameColumn('material_id', 'product_id');
            });

            Schema::table('ddt_items', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }

        // Update material_requests table if it exists
        if (Schema::hasTable('material_requests') && Schema::hasColumn('material_requests', 'material_id')) {
            Schema::table('material_requests', function (Blueprint $table) {
                $table->dropForeign(['material_id']);
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->renameColumn('material_id', 'product_id');
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->foreign('product_id')->references('id')->on('products')->cascadeOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse all changes - rename product_id back to material_id

        if (Schema::hasTable('inventory') && Schema::hasColumn('inventory', 'product_id')) {
            Schema::table('inventory', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
                $table->dropUnique(['product_id', 'warehouse_id']);
                $table->dropIndex(['product_id', 'warehouse_id']);
            });

            Schema::table('inventory', function (Blueprint $table) {
                $table->renameColumn('product_id', 'material_id');
            });

            Schema::table('inventory', function (Blueprint $table) {
                $table->foreign('material_id')->references('id')->on('materials')->cascadeOnDelete();
                $table->unique(['material_id', 'warehouse_id']);
                $table->index(['material_id', 'warehouse_id']);
            });
        }

        if (Schema::hasTable('stock_movements') && Schema::hasColumn('stock_movements', 'product_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->renameColumn('product_id', 'material_id');
            });

            Schema::table('stock_movements', function (Blueprint $table) {
                $table->foreign('material_id')->references('id')->on('materials')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('site_materials') && Schema::hasColumn('site_materials', 'product_id')) {
            Schema::table('site_materials', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });

            Schema::table('site_materials', function (Blueprint $table) {
                $table->renameColumn('product_id', 'material_id');
            });

            Schema::table('site_materials', function (Blueprint $table) {
                $table->foreign('material_id')->references('id')->on('materials')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('quote_items') && Schema::hasColumn('quote_items', 'product_id')) {
            Schema::table('quote_items', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });

            Schema::table('quote_items', function (Blueprint $table) {
                $table->renameColumn('product_id', 'material_id');
            });

            Schema::table('quote_items', function (Blueprint $table) {
                $table->foreign('material_id')->references('id')->on('materials')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('ddt_items') && Schema::hasColumn('ddt_items', 'product_id')) {
            Schema::table('ddt_items', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });

            Schema::table('ddt_items', function (Blueprint $table) {
                $table->renameColumn('product_id', 'material_id');
            });

            Schema::table('ddt_items', function (Blueprint $table) {
                $table->foreign('material_id')->references('id')->on('materials')->cascadeOnDelete();
            });
        }

        if (Schema::hasTable('material_requests') && Schema::hasColumn('material_requests', 'product_id')) {
            Schema::table('material_requests', function (Blueprint $table) {
                $table->dropForeign(['product_id']);
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->renameColumn('product_id', 'material_id');
            });

            Schema::table('material_requests', function (Blueprint $table) {
                $table->foreign('material_id')->references('id')->on('materials')->cascadeOnDelete();
            });
        }
    }
};
