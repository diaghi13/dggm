<?php

namespace Database\Seeders;

use App\Enums\ContractorType;
use App\Enums\RateType;
use App\Models\Contractor;
use Illuminate\Database\Seeder;

class ContractorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Cooperativa Edile Roma
        $cooperativa = Contractor::create([
            'company_name' => 'Cooperativa Edile Roma',
            'vat_number' => '12345678901',
            'tax_code' => '12345678901',
            'contractor_type' => ContractorType::Cooperative,
            'email' => 'info@cooperativaroma.it',
            'phone' => '+39 06 1234567',
            'website' => 'https://cooperativaroma.it',
            'address' => 'Via dei Muratori, 15',
            'city' => 'Roma',
            'province' => 'RM',
            'postal_code' => '00100',
            'country' => 'IT',
            'contact_person' => 'Mario Rossi',
            'contact_email' => 'mario.rossi@cooperativaroma.it',
            'contact_phone' => '+39 333 1234567',
            'iban' => 'IT60X0542811101000000123456',
            'bank_name' => 'Banca Intesa Sanpaolo',
            'payment_terms' => '30 giorni DF FM',
            'specializations' => ['Muratura', 'Intonacatura', 'Carpenteria'],
            'notes' => 'Cooperativa affidabile con esperienza pluriennale nel settore edile',
            'is_active' => true,
        ]);

        // Tariffe Cooperativa Edile Roma
        $cooperativa->rates()->createMany([
            [
                'service_type' => 'Operaio Generico',
                'rate_type' => RateType::Hourly,
                'rate_amount' => 25.00,
                'currency' => 'EUR',
                'minimum_hours' => 8,
                'minimum_amount' => 200.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
            [
                'service_type' => 'Muratore Specializzato',
                'rate_type' => RateType::Hourly,
                'rate_amount' => 35.00,
                'currency' => 'EUR',
                'minimum_hours' => 8,
                'minimum_amount' => 280.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
            [
                'service_type' => 'Capo Squadra',
                'rate_type' => RateType::Hourly,
                'rate_amount' => 42.00,
                'currency' => 'EUR',
                'minimum_hours' => 8,
                'minimum_amount' => 336.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
        ]);

        // Subappalti Costruzioni Milano
        $subappaltatore = Contractor::create([
            'company_name' => 'Subappalti Costruzioni Milano SRL',
            'vat_number' => '98765432109',
            'tax_code' => '98765432109',
            'contractor_type' => ContractorType::Subcontractor,
            'email' => 'info@subappaltimilano.it',
            'phone' => '+39 02 9876543',
            'website' => 'https://subappaltimilano.it',
            'address' => 'Via della Costruzione, 42',
            'city' => 'Milano',
            'province' => 'MI',
            'postal_code' => '20100',
            'country' => 'IT',
            'contact_person' => 'Giuseppe Bianchi',
            'contact_email' => 'g.bianchi@subappaltimilano.it',
            'contact_phone' => '+39 335 9876543',
            'iban' => 'IT60X0542811101000000987654',
            'bank_name' => 'UniCredit',
            'payment_terms' => '60 giorni DF',
            'specializations' => ['Strutture', 'Fondazioni', 'Cemento armato'],
            'notes' => 'Specializzati in opere strutturali e fondazioni',
            'is_active' => true,
        ]);

        // Tariffe Subappalti Costruzioni Milano
        $subappaltatore->rates()->createMany([
            [
                'service_type' => 'Carpentiere',
                'rate_type' => RateType::Hourly,
                'rate_amount' => 38.00,
                'currency' => 'EUR',
                'minimum_hours' => 8,
                'minimum_amount' => 304.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
            [
                'service_type' => 'Ferraiolo',
                'rate_type' => RateType::Hourly,
                'rate_amount' => 36.00,
                'currency' => 'EUR',
                'minimum_hours' => 8,
                'minimum_amount' => 288.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
            [
                'service_type' => 'Opere Strutturali',
                'rate_type' => RateType::FixedProject,
                'rate_amount' => 5000.00,
                'currency' => 'EUR',
                'minimum_hours' => null,
                'minimum_amount' => 5000.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
                'notes' => 'Prezzo a corpo per opere strutturali complete',
            ],
        ]);

        // Agenzia Interinale Lavoro Temporaneo
        $agenzia = Contractor::create([
            'company_name' => 'Agenzia Lavoro Temporaneo Italia',
            'vat_number' => '11122233344',
            'tax_code' => '11122233344',
            'contractor_type' => ContractorType::TemporaryAgency,
            'email' => 'info@agenzialavoro.it',
            'phone' => '+39 06 5555555',
            'website' => 'https://agenzialavoro.it',
            'address' => 'Viale del Lavoro, 88',
            'city' => 'Roma',
            'province' => 'RM',
            'postal_code' => '00150',
            'country' => 'IT',
            'contact_person' => 'Laura Verdi',
            'contact_email' => 'l.verdi@agenzialavoro.it',
            'contact_phone' => '+39 340 5555555',
            'iban' => 'IT60X0542811101000000555555',
            'bank_name' => 'Banco BPM',
            'payment_terms' => '30 giorni DF',
            'specializations' => ['Personale temporaneo', 'Operai generici', 'Manovalanza'],
            'notes' => 'Agenzia per somministrazione di personale temporaneo',
            'is_active' => true,
        ]);

        // Tariffe Agenzia Lavoro Temporaneo
        $agenzia->rates()->createMany([
            [
                'service_type' => 'Operaio Generico',
                'rate_type' => RateType::Daily,
                'rate_amount' => 180.00,
                'currency' => 'EUR',
                'minimum_hours' => null,
                'minimum_amount' => 180.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
            [
                'service_type' => 'Operaio Specializzato',
                'rate_type' => RateType::Daily,
                'rate_amount' => 250.00,
                'currency' => 'EUR',
                'minimum_hours' => null,
                'minimum_amount' => 250.00,
                'valid_from' => now()->startOfYear(),
                'valid_to' => null,
            ],
        ]);
    }
}
