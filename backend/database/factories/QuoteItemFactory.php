<?php

namespace Database\Factories;

use App\Domains\Product\Models\Product;
use App\Domains\Quote\Models\Quote;
use App\Enums\QuoteItemType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Quote\Models\QuoteItem>
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
            'quote_id' => Quote::factory(),
            'parent_id' => null,
            'product_id' => null,
            'price_list_item_id' => null,
            'type' => QuoteItemType::Item,
            'code' => fake()->optional()->bothify('ITEM-###'),
            'description' => fake()->sentence(),
            'notes' => fake()->optional()->sentence(),
            'sort_order' => 0,
            'unit' => fake()->randomElement(['pz', 'kg', 'm', 'm²', 'h']),
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'discount_percentage' => 0,
            'hide_unit_price' => false,
            'subtotal' => $quantity * $unitPrice,
            'discount_amount' => 0,
            'total' => $quantity * $unitPrice,
            'vat_rate' => 22,
            'vat_amount' => 0,
            'total_with_vat' => 0,
            'include_image' => false,
        ];
    }

    /**
     * Indicate that the quote item is a section.
     */
    public function section(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => QuoteItemType::Section,
            'quantity' => 0,
            'unit_price' => 0,
            'subtotal' => 0,
            'discount_amount' => 0,
            'total' => 0,
            'vat_amount' => 0,
            'total_with_vat' => 0,
        ]);
    }

    /**
     * Indicate that the quote item is labor.
     */
    public function labor(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => QuoteItemType::Labor,
            'unit' => 'h',
            'description' => 'Labor hours',
        ]);
    }

    /**
     * Indicate that the quote item is a material.
     */
    public function material(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => QuoteItemType::Material,
        ]);
    }

    /**
     * Indicate that the quote item has a product.
     */
    public function withProduct(): static
    {
        return $this->state(fn (array $attributes) => [
            'product_id' => Product::factory(),
        ]);
    }

    /**
     * Indicate that the quote item has a discount.
     */
    public function withDiscount(float $percentage = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'discount_percentage' => $percentage,
        ]);
    }

    /**
     * Indicate that the quote item has a custom VAT rate.
     */
    public function withVat(float $rate = 22): static
    {
        return $this->state(fn (array $attributes) => [
            'vat_rate' => $rate,
        ]);
    }
}
