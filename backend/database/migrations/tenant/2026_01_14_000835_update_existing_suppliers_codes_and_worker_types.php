<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Generate codes for existing suppliers (materials suppliers without code)
        $suppliers = DB::table('suppliers')
            ->whereNull('code')
            ->orWhere('code', '')
            ->get();

        foreach ($suppliers as $index => $supplier) {
            $code = 'SUP-'.str_pad($supplier->id, 5, '0', STR_PAD_LEFT);
            DB::table('suppliers')
                ->where('id', $supplier->id)
                ->update(['code' => $code]);
        }

        // Update worker_type enum: 'contractor_company' → 'external'
        DB::table('workers')
            ->where('worker_type', 'contractor_company')
            ->update(['worker_type' => 'external']);

        // Note: The WorkerType enum will be updated in the Enum class file separately
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert worker_type: 'external' → 'contractor_company'
        DB::table('workers')
            ->where('worker_type', 'external')
            ->update(['worker_type', 'contractor_company']);
    }
};
