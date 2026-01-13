<?php

namespace Database\Factories;

use App\Models\Customer;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Customer>
 */
class CustomerFactory extends Factory
{
    protected $model = Customer::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $type = fake()->randomElement(['individual', 'company']);

        return [
            'type' => $type,
            'first_name' => $type === 'individual' ? fake()->firstName() : null,
            'last_name' => $type === 'individual' ? fake()->lastName() : null,
            'company_name' => $type === 'company' ? fake()->company() : null,
            'vat_number' => $type === 'company' ? fake()->unique()->numerify('IT###########') : null,
            'tax_code' => fake()->bothify('??#####??###?'),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'mobile' => fake()->phoneNumber(),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'province' => fake()->stateAbbr(),
            'postal_code' => fake()->postcode(),
            'country' => 'IT',
            'payment_terms' => fake()->randomElement(['15', '30', '60', '90']),
            'discount_percentage' => fake()->randomFloat(2, 0, 20),
            'notes' => fake()->optional()->sentence(),
            'is_active' => fake()->boolean(90),
        ];
    }

    /**
     * Indicate that the customer is an individual.
     */
    public function individual(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'individual',
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'company_name' => null,
            'vat_number' => null,
        ]);
    }

    /**
     * Indicate that the customer is a company.
     */
    public function company(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => 'company',
            'company_name' => fake()->company(),
            'vat_number' => fake()->unique()->numerify('IT###########'),
            'first_name' => null,
            'last_name' => null,
        ]);
    }

    /**
     * Indicate that the customer is inactive.
     */
    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'is_active' => false,
        ]);
    }
}
