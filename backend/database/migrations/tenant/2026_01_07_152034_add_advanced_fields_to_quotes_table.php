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
        Schema::table('quotes', function (Blueprint $table) {
            // Only add fields that don't exist yet
            if (! Schema::hasColumn('quotes', 'footer_text')) {
                $table->text('footer_text')->nullable()->after('terms_and_conditions');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quotes', function (Blueprint $table) {
            if (Schema::hasColumn('quotes', 'footer_text')) {
                $table->dropColumn('footer_text');
            }
        });
    }
};
