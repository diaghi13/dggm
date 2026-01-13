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
        Schema::create('quote_templates', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();

            // Logo and branding
            $table->string('logo_path')->nullable();
            $table->string('primary_color')->default('#3B82F6'); // blue-500
            $table->string('secondary_color')->default('#64748B'); // slate-500

            // Layout options
            $table->string('font_family')->default('Inter');
            $table->integer('font_size')->default(10);
            $table->string('page_size')->default('A4');
            $table->string('orientation')->default('portrait');

            // Header/Footer
            $table->text('header_text')->nullable();
            $table->text('footer_text')->nullable();
            $table->boolean('show_logo')->default(true);
            $table->boolean('show_page_numbers')->default(true);

            // Content display
            $table->boolean('show_item_codes')->default(false);
            $table->boolean('show_unit_column')->default(true);
            $table->boolean('group_by_sections')->default(true);

            // System
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->index('is_default');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('quote_templates');
    }
};
