<?php

namespace Database\Factories;

use App\Domains\Product\Models\Product;
use App\Domains\Warehouse\Models\Warehouse;
use App\Enums\StockMovementType;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Warehouse\Models\StockMovement>
 */
class StockMovementFactory extends Factory
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
            'warehouse_id' => Warehouse::factory(),
            'type' => fake()->randomElement(StockMovementType::cases()),
            'quantity' => fake()->randomFloat(2, 1, 100),
            'unit_cost' => fake()->randomFloat(2, 10, 1000),
            'movement_date' => now(),
            'user_id' => User::factory(),
            'notes' => fake()->optional()->sentence,
        ];
    }
}
