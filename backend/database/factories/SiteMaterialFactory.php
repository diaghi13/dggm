<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\SiteMaterial>
 */
class SiteMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $plannedQty = fake()->randomFloat(2, 10, 100);
        $usedQty = fake()->randomFloat(2, 0, $plannedQty * 0.8);
        $plannedCost = fake()->randomFloat(2, 10, 500);

        return [
            'site_id' => \App\Models\Site::factory(),
            'material_id' => \App\Models\Material::factory(),
            'quote_item_id' => null,
            'planned_quantity' => $plannedQty,
            'allocated_quantity' => 0,
            'delivered_quantity' => 0,
            'used_quantity' => $usedQty,
            'returned_quantity' => 0,
            'planned_unit_cost' => $plannedCost,
            'actual_unit_cost' => $plannedCost * fake()->randomFloat(2, 0.9, 1.2),
            'status' => fake()->randomElement(['planned', 'reserved', 'delivered', 'in_use', 'completed', 'returned']),
            'required_date' => fake()->optional()->dateTimeBetween('now', '+60 days'),
            'delivery_date' => fake()->optional()->dateTimeBetween('-30 days', 'now'),
            'notes' => fake()->optional()->sentence(),
            'is_extra' => false,
            'requested_by' => null,
            'requested_at' => null,
            'extra_reason' => null,
        ];
    }

    /**
     * Indicate that the site material is an extra.
     */
    public function extra(int $requestedBy, ?string $reason = null): static
    {
        return $this->state(fn (array $attributes) => [
            'is_extra' => true,
            'requested_by' => $requestedBy,
            'requested_at' => now(),
            'extra_reason' => $reason ?? fake()->sentence(),
            'quote_item_id' => null,
        ]);
    }
}
