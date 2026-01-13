<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\QuoteItem>
 */
class QuoteItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $quantity = fake()->randomFloat(2, 1, 50);
        $unitPrice = fake()->randomFloat(2, 10, 500);

        return [
            'quote_id' => \App\Models\Quote::factory(),
            'material_id' => null,
            'type' => fake()->randomElement(['material', 'labor', 'service', 'other']),
            'description' => fake()->sentence(),
            'quantity' => $quantity,
            'unit' => fake()->randomElement(['pz', 'kg', 'm', 'm²', 'h']),
            'unit_price' => $unitPrice,
            'total' => $quantity * $unitPrice,
            'notes' => fake()->optional()->sentence(),
            'sort_order' => 0,
            'hide_unit_price' => false,
        ];
    }

    /**
     * Indicate that the quote item is a material type.
     */
    public function material(): static
    {
        return $this->state(fn (array $attributes) => [
            'material_id' => \App\Models\Material::factory(),
            'type' => 'material',
        ]);
    }
}
