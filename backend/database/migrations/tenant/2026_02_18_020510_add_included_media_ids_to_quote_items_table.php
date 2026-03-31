<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            // JSON array of specific media IDs to include in the quote PDF.
            // null  → use all media flagged with use_in_quotes=true (default)
            // []    → include nothing
            // [1,5] → include only these specific media IDs
            $table->json('included_media_ids')->nullable()->after('include_image');
        });
    }

    public function down(): void
    {
        Schema::table('quote_items', function (Blueprint $table) {
            $table->dropColumn('included_media_ids');
        });
    }
};
