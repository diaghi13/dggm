<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\ProductComponent>
 */
class ProductComponentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'kit_material_id' => Product::factory(),
            'component_material_id' => Product::factory(),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}
