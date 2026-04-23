<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->string('quarantine_reason', 500)->nullable()->after('quantity_quarantine');
            $table->date('quarantine_since')->nullable()->after('quarantine_reason');
            $table->date('quarantine_resolved_at')->nullable()->after('quarantine_since');
            $table->foreignId('quarantine_resolved_by')->nullable()->constrained('users')->nullOnDelete()->after('quarantine_resolved_at');
        });
    }

    public function down(): void
    {
        Schema::table('inventory', function (Blueprint $table) {
            $table->dropConstrainedForeignId('quarantine_resolved_by');
            $table->dropColumn(['quarantine_reason', 'quarantine_since', 'quarantine_resolved_at']);
        });
    }
};
