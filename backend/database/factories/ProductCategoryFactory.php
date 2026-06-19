<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Product\Models\ProductCategory>
 */
class ProductCategoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->words(2, true),
            'code' => 'CAT-'.fake()->unique()->numberBetween(100, 999),
            'description' => fake()->optional()->sentence(),
            'icon' => fake()->optional()->randomElement(['wrench', 'hammer', 'bolt', 'cog', 'cube']),
            'color' => fake()->optional()->hexColor(),
            'sort_order' => fake()->numberBetween(1, 100),
            'is_active' => true,
        ];
    }
}
