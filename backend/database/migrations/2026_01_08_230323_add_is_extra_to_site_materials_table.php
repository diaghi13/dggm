<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_materials', function (Blueprint $table) {
            $table->boolean('is_extra')->default(false)->after('quote_item_id');
            $table->foreignId('requested_by')->nullable()->after('is_extra')->constrained('users')->nullOnDelete();
            $table->timestamp('requested_at')->nullable()->after('requested_by');
            $table->string('extra_reason')->nullable()->after('requested_at');

            $table->index('is_extra');
        });
    }

    public function down(): void
    {
        Schema::table('site_materials', function (Blueprint $table) {
            $table->dropForeign(['requested_by']);
            $table->dropIndex(['is_extra']);
            $table->dropColumn(['is_extra', 'requested_by', 'requested_at', 'extra_reason']);
        });
    }
};
