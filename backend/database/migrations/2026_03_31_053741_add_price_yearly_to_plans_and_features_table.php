<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    protected $connection = 'landlord';

    public function up(): void
    {
        Schema::connection('landlord')->table('plans', function (Blueprint $table) {
            $table->decimal('price_yearly', 10, 2)->nullable()->after('price');
        });

        Schema::connection('landlord')->table('plan_features', function (Blueprint $table) {
            $table->decimal('price_yearly', 10, 2)->nullable()->after('price');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->table('plans', function (Blueprint $table) {
            $table->dropColumn('price_yearly');
        });

        Schema::connection('landlord')->table('plan_features', function (Blueprint $table) {
            $table->dropColumn('price_yearly');
        });
    }
};
