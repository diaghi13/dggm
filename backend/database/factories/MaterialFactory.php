<?php

namespace Database\Factories;

use App\Enums\MaterialType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Material>
 */
class MaterialFactory extends Factory
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
            'code' => 'MAT-'.str_pad($counter++, 5, '0', STR_PAD_LEFT),
            'name' => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'category' => fake()->randomElement(['construction', 'electrical', 'plumbing', 'equipment', 'tools', 'services']),
            'product_type' => fake()->randomElement(MaterialType::cases())->value,
            'unit' => fake()->randomElement(['pz', 'kg', 'm', 'm²', 'm³', 'l', 'h']),
            'standard_cost' => fake()->randomFloat(2, 10, 500),
            'barcode' => fake()->optional()->ean13(),
            'qr_code' => null,
            'default_supplier_id' => null,
            'reorder_level' => fake()->randomFloat(2, 5, 50),
            'reorder_quantity' => fake()->randomFloat(2, 10, 100),
            'lead_time_days' => fake()->numberBetween(1, 30),
            'location' => fake()->optional()->bothify('Shelf ##-?'),
            'notes' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
