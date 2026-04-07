<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::connection('landlord')->table('service_broadcasts', function (Blueprint $table) {
            $table->timestamp('scheduled_at')->nullable()->after('dispatched_at');
        });
    }

    public function down(): void
    {
        Schema::connection('landlord')->table('service_broadcasts', function (Blueprint $table) {
            $table->dropColumn('scheduled_at');
        });
    }
};
