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
        Schema::table('materials', function (Blueprint $table) {
            $table->boolean('is_package')->default(false)->after('is_kit');
            $table->decimal('package_weight', 10, 2)->nullable()->after('is_package')->comment('Peso in kg');
            $table->decimal('package_volume', 10, 2)->nullable()->after('package_weight')->comment('Volume in m³');
            $table->string('package_dimensions')->nullable()->after('package_volume')->comment('Dimensioni LxWxH in cm');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('materials', function (Blueprint $table) {
            $table->dropColumn(['is_package', 'package_weight', 'package_volume', 'package_dimensions']);
        });
    }
};
