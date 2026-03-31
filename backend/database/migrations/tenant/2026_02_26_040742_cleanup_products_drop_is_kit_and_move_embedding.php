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
     * 1. Drop is_kit (was supposed to be removed in 2026_01_20_130401 but migration
     *    was guarded by hasTable('products') which was false at that time)
     * 2. Move description_embedding to a dedicated product_embeddings table to avoid
     *    bloating every SELECT on the products list with heavy JSON vectors (~10KB each)
     */
    public function up(): void
    {
        // 1. Drop is_kit column (redundant — product_type = 'composite' already covers this)
        if (Schema::hasColumn('products', 'is_kit')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('is_kit');
            });
        }

        // 2. Create the product_embeddings table
        Schema::create('product_embeddings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('product_id')->unique();
            $table->foreign('product_id')->references('id')->on('products')->onDelete('cascade');
            $table->string('model', 100)->nullable()->comment('AI model used, e.g. text-embedding-3-small');
            $table->json('embedding');
            $table->timestamp('generated_at')->nullable();
            $table->timestamps();
        });

        // 3. Migrate any existing embeddings (all NULL currently, but safe for future runs)
        if (Schema::hasColumn('products', 'description_embedding')) {
            // Use DB::table to stay DB-agnostic (SQLite/MySQL compatible)
            DB::table('products')
                ->whereNotNull('description_embedding')
                ->orderBy('id')
                ->each(function ($product) {
                    DB::table('product_embeddings')->insert([
                        'product_id' => $product->id,
                        'embedding' => $product->description_embedding,
                        'generated_at' => $product->updated_at,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                });

            // 4. Drop the column from products
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('description_embedding');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Re-add description_embedding to products
        Schema::table('products', function (Blueprint $table) {
            $table->json('description_embedding')->nullable()->after('description');
        });

        // 2. Copy data back (DB-agnostic: one query per row)
        DB::table('product_embeddings')
            ->orderBy('product_id')
            ->each(function ($row) {
                DB::table('products')
                    ->where('id', $row->product_id)
                    ->update(['description_embedding' => $row->embedding]);
            });

        // 3. Drop the embeddings table
        Schema::dropIfExists('product_embeddings');

        // 4. Re-add is_kit column
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_kit')->default(false)->after('product_type');
        });
    }
};
