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
        Schema::create('materials', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique(); // MAT-00001
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('category')->default('general'); // construction, electrical, plumbing, tools, equipment, other
            $table->string('unit')->default('pz'); // pz, kg, m, m², m³, l, conf
            $table->decimal('standard_cost', 10, 2)->default(0); // Costo standard
            $table->string('barcode')->nullable()->unique(); // Barcode EAN/UPC
            $table->string('qr_code')->nullable(); // QR code per mobile tracking
            $table->foreignId('default_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->decimal('reorder_level', 10, 2)->default(0); // Livello riordino
            $table->decimal('reorder_quantity', 10, 2)->default(0); // Quantità da riordinare
            $table->integer('lead_time_days')->default(7); // Giorni consegna fornitore
            $table->string('location')->nullable(); // Ubicazione magazzino (scaffale, zona)
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('category');
            $table->index('barcode');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('materials');
    }
};
