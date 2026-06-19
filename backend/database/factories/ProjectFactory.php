<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Project\Models\Project>
 */
class ProjectFactory extends Factory
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
            'code' => 'PROJ-'.str_pad($counter++, 4, '0', STR_PAD_LEFT),
            'name' => fake()->words(3, true).' Project',
            'customer_id' => \App\Domains\Customer\Models\Customer::factory(),
            'project_manager_id' => \App\Models\User::factory(),
            'status' => fake()->randomElement(['draft', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled']),
            'description' => fake()->paragraph(),
            'estimated_amount' => fake()->randomFloat(2, 5000, 100000),
            'actual_cost' => fake()->randomFloat(2, 4000, 95000),
            'invoiced_amount' => 0,
            'start_date' => now()->subDays(rand(0, 30))->format('Y-m-d'),
            'estimated_end_date' => now()->addDays(rand(30, 180))->format('Y-m-d'),
            'is_active' => true,
        ];
    }

    public function planned(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'planned',
        ]);
    }

    public function inProgress(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'in_progress',
        ]);
    }

    public function completed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'completed',
            'actual_end_date' => now()->subDays(rand(1, 30))->format('Y-m-d'),
        ]);
    }
}
