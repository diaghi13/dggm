<?php

namespace Database\Seeders;

use App\Models\RentalProfile;
use Illuminate\Database\Seeder;

class RentalProfileSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $profiles = [
            [
                'name' => 'AV / Eventi',
                'sector' => 'av',
                'exponent_curve' => 0.76,
                'decay_strength' => 0.19,
                'max_duration_reference' => 30,
                'duration_offset' => 0.03,
                'max_period_cap_days' => 90,
                'is_default' => true,
                'is_active' => true,
            ],
            [
                'name' => 'Infrastrutture / Automazione',
                'sector' => 'infrastructure',
                'exponent_curve' => 0.69,
                'decay_strength' => 0.27,
                'max_duration_reference' => 30,
                'duration_offset' => 0.15,
                'max_period_cap_days' => 90,
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Edilizia',
                'sector' => 'construction',
                'exponent_curve' => 0.64,
                'decay_strength' => 0.22,
                'max_duration_reference' => 30,
                'duration_offset' => 0.10,
                'max_period_cap_days' => 90,
                'is_default' => false,
                'is_active' => true,
            ],
            [
                'name' => 'Industriale',
                'sector' => 'industrial',
                'exponent_curve' => 0.60,
                'decay_strength' => 0.18,
                'max_duration_reference' => 30,
                'duration_offset' => 0.05,
                'max_period_cap_days' => 90,
                'is_default' => false,
                'is_active' => true,
            ],
        ];

        foreach ($profiles as $profile) {
            RentalProfile::firstOrCreate(['sector' => $profile['sector']], $profile);
        }
    }
}
