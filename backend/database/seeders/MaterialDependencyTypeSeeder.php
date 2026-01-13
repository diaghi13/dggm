<?php

namespace Database\Seeders;

use App\Models\MaterialDependencyType;
use Illuminate\Database\Seeder;

class MaterialDependencyTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['code' => 'container', 'name' => 'Contenitore', 'description' => 'Box, baule, flight case', 'sort_order' => 1],
            ['code' => 'accessory', 'name' => 'Accessorio', 'description' => 'Accessori necessari', 'sort_order' => 2],
            ['code' => 'cable', 'name' => 'Cavo', 'description' => 'Cavi di alimentazione/segnale', 'sort_order' => 3],
            ['code' => 'consumable', 'name' => 'Consumabile', 'description' => 'Materiali consumabili', 'sort_order' => 4],
            ['code' => 'tool', 'name' => 'Attrezzo', 'description' => 'Attrezzi necessari', 'sort_order' => 5],
        ];

        foreach ($types as $type) {
            MaterialDependencyType::updateOrCreate(
                ['code' => $type['code']],
                $type
            );
        }
    }
}
