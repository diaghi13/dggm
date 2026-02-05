<?php

namespace Database\Seeders;

use App\Models\DiscountFamily;
use App\Models\Supplier;
use Illuminate\Database\Seeder;

class DiscountFamilySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find first supplier or create a sample one
        $supplier = Supplier::first();

        if (! $supplier) {
            $supplier = Supplier::create([
                'company_name' => 'Fornitore Esempio',
                'vat_number' => '12345678901',
                'is_active' => true,
                'supplier_type' => 'materials',
            ]);
        }

        $families = [
            [
                'supplier_id' => $supplier->id,
                'code' => 'COM1',
                'name' => 'Componentistica Standard',
                'description' => 'Sconto standard per componentistica elettrica',
                'discount_1' => 10.00,
                'discount_2' => 10.00,
                'discount_3' => 5.00,
                'is_active' => true,
            ],
            [
                'supplier_id' => $supplier->id,
                'code' => 'PREM',
                'name' => 'Prodotti Premium',
                'description' => 'Sconto ridotto per prodotti premium',
                'discount_1' => 5.00,
                'discount_2' => 0.00,
                'discount_3' => 0.00,
                'is_active' => true,
            ],
            [
                'supplier_id' => $supplier->id,
                'code' => 'PROMO',
                'name' => 'Promozione Speciale',
                'description' => 'Sconto promozionale alto',
                'discount_1' => 20.00,
                'discount_2' => 10.00,
                'discount_3' => 5.00,
                'is_active' => true,
            ],
        ];

        foreach ($families as $family) {
            DiscountFamily::updateOrCreate(
                [
                    'supplier_id' => $family['supplier_id'],
                    'code' => $family['code'],
                ],
                $family
            );
        }
    }
}
