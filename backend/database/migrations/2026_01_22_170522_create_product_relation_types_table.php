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
        Schema::create('product_relation_types', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique()->comment('Unique code (e.g., container, accessory)');
            $table->string('name', 100)->comment('Display name');
            $table->text('description')->nullable();
            $table->string('icon', 50)->nullable()->comment('Icon name (lucide-react)');
            $table->string('color', 7)->nullable()->comment('HEX color for UI (#FF5733)');
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_relation_types');
    }
};
