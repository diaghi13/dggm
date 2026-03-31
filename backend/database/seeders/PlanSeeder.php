<?php

namespace Database\Seeders;

use App\Models\Landlord\Plan;
use App\Models\Landlord\PlanFeature;
use Illuminate\Database\Seeder;

class PlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Base',
                'slug' => 'base',
                'description' => 'Anagrafiche, preventivi e cantieri',
                'price' => null,
                'sort_order' => 1,
                'features' => ['customers', 'suppliers', 'quotes', 'projects'],
            ],
            [
                'name' => 'Base + Magazzino',
                'slug' => 'base-warehouse',
                'description' => 'Base + gestione magazzino, DDT e movimenti',
                'price' => null,
                'sort_order' => 2,
                'features' => ['customers', 'suppliers', 'quotes', 'projects', 'warehouse'],
            ],
            [
                'name' => 'Base + Personale',
                'slug' => 'base-personnel',
                'description' => 'Base + gestione personale, presenze e costi',
                'price' => null,
                'sort_order' => 3,
                'features' => ['customers', 'suppliers', 'quotes', 'projects', 'workers'],
            ],
            [
                'name' => 'Completo',
                'slug' => 'full',
                'description' => 'Tutte le funzionalità incluse',
                'price' => null,
                'sort_order' => 4,
                'features' => ['customers', 'suppliers', 'quotes', 'projects', 'warehouse', 'workers', 'rental'],
            ],
        ];

        foreach ($plans as $planData) {
            $features = $planData['features'];
            unset($planData['features']);

            $plan = Plan::firstOrCreate(['slug' => $planData['slug']], $planData);

            foreach ($features as $featureKey) {
                PlanFeature::firstOrCreate(
                    ['plan_id' => $plan->id, 'feature_key' => $featureKey]
                );
            }
        }
    }
}
