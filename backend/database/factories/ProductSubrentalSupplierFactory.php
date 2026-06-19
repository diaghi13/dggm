<?php

namespace Database\Factories;

use App\Domains\Product\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Product\Models\ProductSubrentalSupplier>
 */
class ProductSubrentalSupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'supplier_id' => Supplier::factory(),
            'day_rate' => fake()->randomFloat(2, 5, 500),
            'reliability_score' => fake()->randomFloat(1, 0, 5),
            'is_preferred' => false,
            'last_updated' => now()->toDateString(),
            'notes' => null,
        ];
    }

    /**
     * Mark as preferred supplier.
     */
    public function preferred(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_preferred' => true,
        ]);
    }
}
