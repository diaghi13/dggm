<?php

namespace Database\Seeders;

use App\Models\ProductRelationType;
use Illuminate\Database\Seeder;

class ProductRelationTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            ['code' => 'component', 'name' => 'Componente', 'icon' => 'package', 'color' => '#3B82F6', 'sort_order' => 1],
            ['code' => 'container', 'name' => 'Contenitore', 'icon' => 'box', 'color' => '#64748B', 'sort_order' => 2],
            ['code' => 'accessory', 'name' => 'Accessorio', 'icon' => 'plug', 'color' => '#8B5CF6', 'sort_order' => 3],
            ['code' => 'cable', 'name' => 'Cavo', 'icon' => 'cable', 'color' => '#F59E0B', 'sort_order' => 4],
            ['code' => 'consumable', 'name' => 'Consumabile', 'icon' => 'shopping-bag', 'color' => '#10B981', 'sort_order' => 5],
            ['code' => 'tool', 'name' => 'Attrezzo', 'icon' => 'wrench', 'color' => '#EF4444', 'sort_order' => 6],
        ];

        foreach ($types as $type) {
            ProductRelationType::updateOrCreate(
                ['code' => $type['code']],
                $type
            );
        }
    }
}
