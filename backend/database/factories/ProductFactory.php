<?php

namespace Database\Factories;

use App\Enums\ProductType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'PROD-'.fake()->unique()->numberBetween(10000, 99999),
            'name' => fake()->words(3, true),
            'description' => fake()->sentence(),
            //'category' => fake()->randomElement(['Edilizia', 'Elettrico', 'Idraulico', 'Carpenteria', 'Ferramenta']),
            'product_type' => fake()->randomElement(ProductType::cases()),
            'unit' => fake()->randomElement(['pz', 'mt', 'kg', 'mq', 'mc', 'ora']),
            'standard_cost' => fake()->randomFloat(2, 10, 500),
            'purchase_price' => fake()->randomFloat(2, 10, 500),
            'markup_percentage' => fake()->randomFloat(2, 10, 50),
            'sale_price' => fake()->randomFloat(2, 15, 750),
            'rental_price_daily' => fake()->randomFloat(2, 5, 100),
            'rental_price_weekly' => fake()->randomFloat(2, 20, 400),
            'rental_price_monthly' => fake()->randomFloat(2, 50, 1000),
            'barcode' => fake()->optional()->ean13(),
            'qr_code' => fake()->optional()->uuid(),
            'default_supplier_id' => null,
            'reorder_level' => fake()->randomFloat(2, 1, 50),
            'reorder_quantity' => fake()->randomFloat(2, 5, 100),
            'lead_time_days' => fake()->numberBetween(1, 30),
            'location' => fake()->optional()->word(),
            'notes' => fake()->optional()->sentence(),
            'is_rentable' => fake()->boolean(30),
            'quantity_out_on_rental' => 0,
            'is_active' => true,
            'is_package' => fake()->boolean(10),
            'package_weight' => fake()->optional()->randomFloat(2, 0.1, 100),
            'package_volume' => fake()->optional()->randomFloat(2, 0.1, 10),
            'package_dimensions' => fake()->optional()->regexify('[0-9]{2}x[0-9]{2}x[0-9]{2}'),
        ];
    }

    /**
     * Indicate that the product is an article
     */
    public function article(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_type' => ProductType::ARTICLE,
        ]);
    }

    /**
     * Indicate that the product is a service
     */
    public function service(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_type' => ProductType::SERVICE,
            'is_rentable' => false,
        ]);
    }

    /**
     * Indicate that the product is a composite
     */
    public function composite(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_type' => ProductType::COMPOSITE,
        ]);
    }

    /**
     * Indicate that the product is rentable
     */
    public function rentable(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_rentable' => true,
            'rental_price_daily' => fake()->randomFloat(2, 5, 100),
            'rental_price_weekly' => fake()->randomFloat(2, 20, 400),
            'rental_price_monthly' => fake()->randomFloat(2, 50, 1000),
        ]);
    }

    /**
     * Indicate that the product is inactive
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
