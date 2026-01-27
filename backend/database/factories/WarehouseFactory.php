<?php

namespace Database\Factories;

use App\Enums\WarehouseType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Warehouse>
 */
class WarehouseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->bothify('WH-###'),
            'name' => $this->faker->company(),
            'type' => $this->faker->randomElement(WarehouseType::cases()),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'province' => $this->faker->stateAbbr(),
            'postal_code' => $this->faker->postcode(),
            'manager_id' => null, // Assuming manager will be assigned later
            'notes' => $this->faker->optional()->sentence(),
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
        ];
    }
}
