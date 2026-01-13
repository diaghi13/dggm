<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Site>
 */
class SiteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        static $counter = 1;

        return [
            'code' => 'SITE-'.str_pad($counter++, 4, '0', STR_PAD_LEFT),
            'name' => fake()->words(3, true).' Construction Site',
            'customer_id' => \App\Models\Customer::factory(),
            'project_manager_id' => \App\Models\User::factory(),
            'status' => fake()->randomElement(['draft', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled']),
            'description' => fake()->paragraph(),
            'estimated_amount' => fake()->randomFloat(2, 5000, 100000),
            'actual_cost' => fake()->randomFloat(2, 4000, 95000),
            'invoiced_amount' => 0,
            'start_date' => now()->subDays(rand(0, 30)),
            'estimated_end_date' => now()->addDays(rand(30, 180)),
        ];
    }
}
