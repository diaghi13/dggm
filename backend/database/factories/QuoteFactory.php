<?php

namespace Database\Factories;

use App\Domains\Customer\Models\Customer;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Domains\Quote\Models\Quote>
 */
class QuoteFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => 'Q-'.now()->format('Y').'-'.str_pad(fake()->unique()->numberBetween(1, 9999), 4, '0', STR_PAD_LEFT),
            'title' => fake()->sentence(3),
            'customer_id' => Customer::factory(),
            'project_manager_id' => User::factory(),
            'description' => fake()->optional()->paragraph(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->stateAbbr(),
            'postal_code' => fake()->postcode(),
            'status' => 'draft',
            'issue_date' => now(),
            'expiry_date' => now()->addDays(30),
            'sent_date' => null,
            'approved_date' => null,
            'subtotal' => 0,
            'discount_percentage' => 0,
            'discount_amount' => 0,
            'tax_percentage' => 22,
            'show_tax' => true,
            'tax_included' => false,
            'show_unit_prices' => true,
            'tax_amount' => 0,
            'total_amount' => 0,
            'payment_method' => null,
            'payment_terms' => null,
            'template_id' => null,
            'project_id' => null,
            'notes' => fake()->optional()->paragraph(),
            'terms_and_conditions' => fake()->optional()->paragraph(),
            'footer_text' => null,
            'price_list_id' => null,
            'payment_term_id' => null,
            'deposit_percentage' => 0,
            'deposit_amount' => 0,
            'work_start_description' => null,
            'work_start_date' => null,
            'work_duration_description' => null,
            'work_end_date' => null,
            'warranty_type_id' => null,
            'show_product_codes' => true,
            'show_vat' => true,
            'vat_included_in_prices' => false,
            'include_terms_and_conditions' => true,
        ];
    }

    /**
     * Indicate that the quote is in draft status.
     */
    public function draft(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'draft',
            'sent_date' => null,
            'approved_date' => null,
        ]);
    }

    /**
     * Indicate that the quote has been sent.
     */
    public function sent(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'sent',
            'sent_date' => now(),
            'approved_date' => null,
        ]);
    }

    /**
     * Indicate that the quote has been approved.
     */
    public function approved(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'approved',
            'sent_date' => now()->subDays(5),
            'approved_date' => now(),
        ]);
    }

    /**
     * Indicate that the quote has been rejected.
     */
    public function rejected(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'rejected',
            'sent_date' => now()->subDays(5),
            'approved_date' => null,
        ]);
    }

    /**
     * Indicate that the quote has a discount.
     */
    public function withDiscount(float $percentage = 10): static
    {
        return $this->state(fn (array $attributes) => [
            'discount_percentage' => $percentage,
        ]);
    }

    /**
     * Indicate that the quote requires a deposit.
     */
    public function withDeposit(float $percentage = 50): static
    {
        return $this->state(fn (array $attributes) => [
            'deposit_percentage' => $percentage,
        ]);
    }
}
