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
            $table->unsignedInteger('trial_days')->default(0)->after('sort_order');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->table('plans', function (Blueprint $table) {
            $table->dropColumn('trial_days');
        });
    }
};
