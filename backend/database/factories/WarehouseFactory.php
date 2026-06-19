<?php

namespace Database\Factories;

use App\Domains\Warehouse\Models\Warehouse;
use App\Enums\WarehouseType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Warehouse\Models\Warehouse>
 */
class WarehouseFactory extends Factory
{
    protected $model = Warehouse::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'WH-'.fake()->unique()->numberBetween(100, 999),
            'name' => fake()->words(3, true),
            'type' => fake()->randomElement(WarehouseType::cases()),
            'address' => fake()->streetAddress,
            'city' => fake()->city,
            'province' => fake()->stateAbbr,
            'postal_code' => fake()->postcode,
            'manager_id' => null,
            'notes' => fake()->optional()->sentence,
            'is_active' => fake()->boolean(90),
        ];
    }
}
