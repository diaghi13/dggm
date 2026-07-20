<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropUnique(['code']);

            $table->unsignedSmallInteger('version')->default(1)->after('code');
            $table->foreignId('original_quote_id')->nullable()->after('version')
                ->constrained('quotes')->nullOnDelete();
            $table->boolean('is_current_version')->default(true)->after('original_quote_id');
            $table->text('revision_notes')->nullable()->after('is_current_version');

            $table->unique(['code', 'version']);
            $table->index('original_quote_id');
            $table->index('is_current_version');
        });
    }

    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            $table->dropUnique(['code', 'version']);
            $table->dropIndex(['original_quote_id']);
            $table->dropIndex(['is_current_version']);
            $table->dropForeign(['original_quote_id']);
            $table->dropColumn(['version', 'original_quote_id', 'is_current_version', 'revision_notes']);
            $table->unique('code');
        });
    }
};
