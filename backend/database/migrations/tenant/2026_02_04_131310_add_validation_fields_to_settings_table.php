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
        Schema::table('settings', function (Blueprint $table) {
            // Validation rules (JSON array of Laravel validation rules)
            $table->json('validation_rules')->nullable()->after('description');

            // Allowed values for ENUM type (JSON array)
            $table->json('allowed_values')->nullable()->after('validation_rules');

            // Min/Max values for NUMBER type
            $table->decimal('min_value', 20, 6)->nullable()->after('allowed_values');
            $table->decimal('max_value', 20, 6)->nullable()->after('min_value');

            // Default value (for reset functionality)
            $table->text('default_value')->nullable()->after('max_value');

            // Display order (for UI sorting)
            $table->integer('order')->default(0)->after('default_value');

            // Is feature flag (for point 7)
            $table->boolean('is_feature_flag')->default(false)->after('order');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropColumn([
                'validation_rules',
                'allowed_values',
                'min_value',
                'max_value',
                'default_value',
                'order',
                'is_feature_flag',
            ]);
        });
    }
};
