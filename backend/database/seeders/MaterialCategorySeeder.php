<?php

namespace Database\Seeders;

use App\Models\MaterialCategory;
use Illuminate\Database\Seeder;

class MaterialCategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['code' => 'general', 'name' => 'Generale', 'description' => 'Materiali generici', 'sort_order' => 1],
            ['code' => 'construction', 'name' => 'Edilizia', 'description' => 'Materiali da costruzione', 'sort_order' => 2],
            ['code' => 'electrical', 'name' => 'Elettrico', 'description' => 'Materiali elettrici', 'sort_order' => 3],
            ['code' => 'plumbing', 'name' => 'Idraulico', 'description' => 'Materiali idraulici', 'sort_order' => 4],
            ['code' => 'tools', 'name' => 'Attrezzi', 'description' => 'Attrezzi e utensili', 'sort_order' => 5],
            ['code' => 'equipment', 'name' => 'Attrezzature', 'description' => 'Attrezzature e macchinari', 'sort_order' => 6],
            ['code' => 'safety', 'name' => 'Sicurezza', 'description' => 'Dispositivi di protezione individuale', 'sort_order' => 7],
            ['code' => 'packaging', 'name' => 'Imballaggio', 'description' => 'Materiali di imballaggio', 'sort_order' => 8],
            ['code' => 'other', 'name' => 'Altro', 'description' => 'Altre categorie', 'sort_order' => 99],
        ];

        foreach ($categories as $category) {
            MaterialCategory::updateOrCreate(
                ['code' => $category['code']],
                $category
            );
        }
    }
}
