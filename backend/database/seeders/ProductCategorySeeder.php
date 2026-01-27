<?php

namespace Database\Seeders;

use App\Models\ProductCategory;
use Illuminate\Database\Seeder;

class ProductCategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $categories = [
            ['code' => 'electrical', 'name' => 'Materiale Elettrico', 'icon' => 'zap', 'color' => '#F59E0B', 'sort_order' => 1],
            ['code' => 'plumbing', 'name' => 'Idraulica', 'icon' => 'droplet', 'color' => '#3B82F6', 'sort_order' => 2],
            ['code' => 'construction', 'name' => 'Edilizia', 'icon' => 'hard-hat', 'color' => '#EF4444', 'sort_order' => 3],
            ['code' => 'tools', 'name' => 'Utensili', 'icon' => 'wrench', 'color' => '#8B5CF6', 'sort_order' => 4],
            ['code' => 'equipment', 'name' => 'Attrezzature', 'icon' => 'box', 'color' => '#10B981', 'sort_order' => 5],
            ['code' => 'automation', 'name' => 'Automazione', 'icon' => 'cpu', 'color' => '#6366F1', 'sort_order' => 6],
            ['code' => 'lighting', 'name' => 'Illuminazione', 'icon' => 'lightbulb', 'color' => '#FBBF24', 'sort_order' => 7],
            ['code' => 'containers', 'name' => 'Contenitori/Bauli', 'icon' => 'package', 'color' => '#64748B', 'sort_order' => 8],
            ['code' => 'other', 'name' => 'Altro', 'icon' => 'more-horizontal', 'color' => '#94A3B8', 'sort_order' => 9],
        ];

        foreach ($categories as $category) {
            ProductCategory::updateOrCreate(
                ['code' => $category['code']],
                $category
            );
        }
    }
}
