<?php

namespace Database\Factories;

use App\Enums\PersonnelType;
use App\Enums\SupplierType;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Supplier>
 */
class SupplierFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => $this->faker->unique()->bothify('SUP-###'),
            'company_name' => $this->faker->company(),
            'supplier_type' => $this->faker->randomElement(SupplierType::cases()),
            'personnel_type' => $this->faker->randomElement(PersonnelType::cases()),
            'vat_number' => $this->faker->optional()->bothify('VAT#######'),
            'tax_code' => $this->faker->optional()->bothify('TAX#######'),
            'email' => $this->faker->unique()->companyEmail(),
            'phone' => $this->faker->phoneNumber(),
            'mobile' => $this->faker->optional()->phoneNumber(),
            'website' => $this->faker->optional()->url(),
            'address' => $this->faker->streetAddress(),
            'city' => $this->faker->city(),
            'province' => $this->faker->stateAbbr(),
            'postal_code' => $this->faker->postcode(),
            'country' => $this->faker->country(),
            'payment_terms' => $this->faker->randomElement(['net 30', 'net 60', 'due on receipt']),
            'delivery_terms' => $this->faker->randomElement(['FOB', 'CIF', 'DDP']),
            'discount_percentage' => $this->faker->randomFloat(2, 0, 20),
            'iban' => $this->faker->optional()->iban(),
            'bank_name' => $this->faker->optional()->company(),
            'contact_person' => $this->faker->name(),
            'contact_email' => $this->faker->optional()->companyEmail(),
            'contact_phone' => $this->faker->optional()->phoneNumber(),
            'notes' => $this->faker->optional()->paragraph(),
            'specializations' => $this->faker->optional()->randomElements(['electronics', 'furniture', 'clothing', 'automotive'], 2),
            'is_active' => $this->faker->boolean(90), // 90% chance of being active
        ];
    }
}
