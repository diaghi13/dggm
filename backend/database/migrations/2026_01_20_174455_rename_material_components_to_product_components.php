<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Rename material_components table to product_components
     * and update foreign key columns to use product_ prefix
     */
    public function up(): void
    {
        // Only run if material_components exists and product_components doesn't
        if (! Schema::hasTable('material_components')) {
            return;
        }

        if (Schema::hasTable('product_components')) {
            return;
        }

        // Check if we need to rename (columns still have material_ prefix)
        if (! Schema::hasColumn('material_components', 'kit_material_id')) {
            // Already renamed, skip
            return;
        }

        // Rename table
        Schema::rename('material_components', 'product_components');

        // For SQLite, we need to use raw SQL to rename columns
        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite doesn't support direct column rename, needs table recreation
            // But since we're in test environment, we can skip the complex rename
            // and just recreate the table with new column names

            // Get existing data
            $existingData = DB::table('product_components')->get();

            // Drop and recreate table
            Schema::dropIfExists('product_components');

            Schema::create('product_components', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kit_product_id')->constrained('products')->cascadeOnDelete();
                $table->foreignId('component_product_id')->constrained('products')->cascadeOnDelete();
                $table->decimal('quantity', 10, 2)->default(1);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['kit_product_id', 'component_product_id']);
                $table->index('kit_product_id');
            });

            // Restore data with new column names
            foreach ($existingData as $row) {
                DB::table('product_components')->insert([
                    'id' => $row->id,
                    'kit_product_id' => $row->kit_material_id,
                    'component_product_id' => $row->component_material_id,
                    'quantity' => $row->quantity,
                    'notes' => $row->notes,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }
        } else {
            // MySQL/PostgreSQL - use proper ALTER TABLE statements
//            DB::unprepared('
//                ALTER TABLE product_components
//                DROP FOREIGN KEY IF EXISTS product_components_kit_material_id_foreign,
//                DROP FOREIGN KEY IF EXISTS product_components_component_material_id_foreign,
//                DROP INDEX IF EXISTS product_components_kit_material_id_component_material_id_unique,
//                DROP INDEX IF EXISTS product_components_kit_material_id_index;
//            ');

            $this->dropForeignKeyIfExists('product_components', 'product_components_kit_material_id_foreign');
            $this->dropForeignKeyIfExists('product_components', 'product_components_component_material_id_foreign');

            $this->dropIndexIfExists('product_components', 'product_components_kit_material_id_component_material_id_unique');
            $this->dropIndexIfExists('product_components', 'product_components_kit_material_id_index');

            // Rename columns
            DB::statement('ALTER TABLE product_components RENAME COLUMN kit_material_id TO kit_product_id');
            DB::statement('ALTER TABLE product_components RENAME COLUMN component_material_id TO component_product_id');

            // Re-add foreign keys with new column names
            Schema::table('product_components', function (Blueprint $table) {
                $table->foreign('kit_product_id')->references('id')->on('products')->cascadeOnDelete();
                $table->foreign('component_product_id')->references('id')->on('products')->cascadeOnDelete();

                $table->unique(['kit_product_id', 'component_product_id']);
                $table->index('kit_product_id');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Only run if product_components exists
        if (! Schema::hasTable('product_components')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            // SQLite approach: recreate table
            $existingData = DB::table('product_components')->get();

            Schema::dropIfExists('product_components');

            Schema::create('material_components', function (Blueprint $table) {
                $table->id();
                $table->foreignId('kit_material_id')->constrained('materials')->cascadeOnDelete();
                $table->foreignId('component_material_id')->constrained('materials')->cascadeOnDelete();
                $table->decimal('quantity', 10, 2)->default(1);
                $table->text('notes')->nullable();
                $table->timestamps();

                $table->unique(['kit_material_id', 'component_material_id']);
                $table->index('kit_material_id');
            });

            foreach ($existingData as $row) {
                DB::table('material_components')->insert([
                    'id' => $row->id,
                    'kit_material_id' => $row->kit_product_id,
                    'component_material_id' => $row->component_product_id,
                    'quantity' => $row->quantity,
                    'notes' => $row->notes,
                    'created_at' => $row->created_at,
                    'updated_at' => $row->updated_at,
                ]);
            }
        } else {
            // MySQL/PostgreSQL
            Schema::table('product_components', function (Blueprint $table) {
                $table->dropForeign(['kit_product_id']);
                $table->dropForeign(['component_product_id']);
                $table->dropUnique(['kit_product_id', 'component_product_id']);
                $table->dropIndex(['kit_product_id']);
            });

            DB::statement('ALTER TABLE product_components RENAME COLUMN kit_product_id TO kit_material_id');
            DB::statement('ALTER TABLE product_components RENAME COLUMN component_product_id TO component_material_id');

            Schema::table('product_components', function (Blueprint $table) {
                $table->foreign('kit_material_id')->references('id')->on('products')->cascadeOnDelete();
                $table->foreign('component_material_id')->references('id')->on('products')->cascadeOnDelete();

                $table->unique(['kit_material_id', 'component_material_id']);
                $table->index('kit_material_id');
            });

            Schema::rename('product_components', 'material_components');
        }
    }

    private function dropForeignKeyIfExists($table, $foreignKey)
    {
        $exists = DB::select(
            "SELECT CONSTRAINT_NAME
             FROM information_schema.TABLE_CONSTRAINTS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND CONSTRAINT_NAME = ?
               AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
            [$table, $foreignKey]
        );

        if (!empty($exists)) {
            DB::statement("ALTER TABLE {$table} DROP FOREIGN KEY {$foreignKey}");
        }
    }

    private function dropIndexIfExists($table, $indexName)
    {
        $exists = DB::select(
            "SELECT INDEX_NAME
             FROM information_schema.STATISTICS
             WHERE TABLE_SCHEMA = DATABASE()
               AND TABLE_NAME = ?
               AND INDEX_NAME = ?",
            [$table, $indexName]
        );

        if (!empty($exists)) {
            DB::statement("ALTER TABLE {$table} DROP INDEX {$indexName}");
        }
    }
};
