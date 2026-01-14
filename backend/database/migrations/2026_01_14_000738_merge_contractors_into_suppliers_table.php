<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Step 1: Add new fields to suppliers table
        Schema::table('suppliers', function (Blueprint $table) {
            // Supplier type (materials, personnel, both)
            $table->string('supplier_type')->default('materials')->after('company_name');

            // Personnel type (only if provides personnel)
            $table->string('personnel_type')->nullable()->after('supplier_type');
            // Values: cooperative, staffing_agency, rental_with_operator, subcontractor, technical_services

            // Add code field for consistency
            $table->string('code')->unique()->after('id');

            // Add specializations JSON (from contractors)
            $table->json('specializations')->nullable()->after('notes');

            // Indexes
            $table->index('supplier_type');
            $table->index('personnel_type');
            $table->index('code');
        });

        // Step 2: Migrate data from contractors to suppliers
        $contractors = DB::table('contractors')->get();

        foreach ($contractors as $contractor) {
            // Determine supplier_type based on contractor_type
            $personnelType = match ($contractor->contractor_type) {
                'cooperative' => 'cooperative',
                'subcontractor' => 'subcontractor',
                'temporary_agency' => 'staffing_agency',
                default => 'cooperative'
            };

            DB::table('suppliers')->insert([
                'code' => $contractor->code,
                'company_name' => $contractor->company_name,
                'supplier_type' => 'personnel', // All contractors provide personnel
                'personnel_type' => $personnelType,
                'vat_number' => $contractor->vat_number,
                'tax_code' => $contractor->tax_code,
                'email' => $contractor->email,
                'phone' => $contractor->phone,
                'mobile' => null, // contractors didn't have mobile
                'website' => $contractor->website,
                'address' => $contractor->address,
                'city' => $contractor->city,
                'province' => $contractor->province,
                'postal_code' => $contractor->postal_code,
                'country' => $contractor->country,
                'payment_terms' => $contractor->payment_terms,
                'delivery_terms' => null,
                'discount_percentage' => 0,
                'iban' => $contractor->iban,
                'bank_name' => $contractor->bank_name,
                'contact_person' => $contractor->contact_person,
                'contact_email' => $contractor->contact_email,
                'contact_phone' => $contractor->contact_phone,
                'notes' => $contractor->notes,
                'specializations' => $contractor->specializations,
                'is_active' => $contractor->is_active,
                'created_at' => $contractor->created_at,
                'updated_at' => $contractor->updated_at,
                'deleted_at' => $contractor->deleted_at ?? null,
            ]);
        }

        // Step 3: Update workers table - rename contractor_company_id to supplier_id
        Schema::table('workers', function (Blueprint $table) {
            // Drop foreign key if exists
            try {
                $table->dropForeign(['contractor_company_id']);
            } catch (\Exception $e) {
                // Foreign key might not exist
            }

            // Rename column
            $table->renameColumn('contractor_company_id', 'supplier_id');
        });

        // Step 4: Update supplier_id references from old contractor IDs to new supplier IDs
        foreach ($contractors as $contractor) {
            $newSupplier = DB::table('suppliers')
                ->where('code', $contractor->code)
                ->where('supplier_type', 'personnel')
                ->first();

            if ($newSupplier) {
                DB::table('workers')
                    ->where('supplier_id', $contractor->id)
                    ->update(['supplier_id' => $newSupplier->id]);

                // Update site_labor_costs contractor_id references
                DB::table('site_labor_costs')
                    ->where('contractor_id', $contractor->id)
                    ->update(['contractor_id' => $newSupplier->id]);
            }
        }

        // Step 5: Add foreign key constraint
        Schema::table('workers', function (Blueprint $table) {
            $table->foreign('supplier_id')
                ->references('id')
                ->on('suppliers')
                ->nullOnDelete();
        });

        // Step 6: Update worker_type enum to include 'external' instead of 'contractor_company'
        // Note: Will be done in separate migration for worker_rates and workers tables
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove supplier_id foreign key
        Schema::table('workers', function (Blueprint $table) {
            $table->dropForeign(['supplier_id']);
            $table->renameColumn('supplier_id', 'contractor_company_id');
        });

        // Restore contractor_company_id foreign key
        Schema::table('workers', function (Blueprint $table) {
            $table->foreign('contractor_company_id')
                ->references('id')
                ->on('contractors')
                ->nullOnDelete();
        });

        // Remove added fields from suppliers
        Schema::table('suppliers', function (Blueprint $table) {
            $table->dropIndex(['supplier_type']);
            $table->dropIndex(['personnel_type']);
            $table->dropIndex(['code']);
            $table->dropColumn(['supplier_type', 'personnel_type', 'code', 'specializations']);
        });

        // Note: We don't restore contractors data as it's a destructive operation
        // Manual restore would be needed if rollback is required
    }
};
