<?php

namespace Database\Factories;

use App\Domains\Product\Models\Product;
use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SupplierProduct>
 */
class SupplierProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'supplier_id' => Supplier::factory(),
            'product_id' => Product::factory(),
            'supplier_product_code' => fake()->unique()->regexify('[A-Z]{3}-[0-9]{4}'),
            'supplier_ean' => fake()->optional()->ean13(),
            'purchase_price' => fake()->randomFloat(2, 1, 1000),
            'wholesale_price' => fake()->optional()->randomFloat(2, 10, 1500),
            'retail_price' => fake()->optional()->randomFloat(2, 15, 2000),
            'discount_family_id' => null,
            'manual_discount_1' => fake()->optional()->randomFloat(2, 0, 20),
            'manual_discount_2' => fake()->optional()->randomFloat(2, 0, 10),
            'manual_discount_3' => fake()->optional()->randomFloat(2, 0, 5),
            'package_quantity' => fake()->numberBetween(1, 100),
            'minimum_order_quantity' => fake()->numberBetween(1, 10),
            'maximum_order_quantity' => fake()->numberBetween(1000, 999999),
            'multiple_order_quantity' => fake()->optional()->numberBetween(1, 20),
            'lead_time_days' => fake()->numberBetween(1, 30),
            'payment_term_id' => null,
            'price_multiplier' => fake()->randomFloat(2, 0.8, 1.5),
            'currency' => 'EUR',
            'last_price_update' => fake()->optional()->dateTimeBetween('-6 months'),
            'is_preferred_supplier' => fake()->boolean(20),
            'is_active' => fake()->boolean(90),
            'notes' => fake()->optional()->sentence(),
        ];
    }

    /**
     * Indicate that this is the preferred supplier for the product
     */
    public function preferred(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_preferred_supplier' => true,
        ]);
    }

    /**
     * Indicate that this supplier product is inactive
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
