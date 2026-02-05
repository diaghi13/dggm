<?php

namespace Database\Seeders;

use App\Models\PaymentTerm;
use Illuminate\Database\Seeder;

class PaymentTermSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $terms = [
            [
                'code' => 'CASH',
                'name' => 'Contanti',
                'description' => 'Pagamento immediato in contanti',
                'days' => 0,
                'payment_type' => 'cash',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'code' => 'NET15',
                'name' => 'Netto 15 giorni',
                'description' => 'Pagamento a 15 giorni data fattura',
                'days' => 15,
                'payment_type' => 'bank_transfer',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'code' => 'NET30',
                'name' => 'Netto 30 giorni fm',
                'description' => 'Pagamento a 30 giorni fine mese',
                'days' => 30,
                'payment_type' => 'bank_transfer',
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'code' => 'NET60',
                'name' => 'Netto 60 giorni dfm',
                'description' => 'Pagamento a 60 giorni data fine mese',
                'days' => 60,
                'payment_type' => 'bank_transfer',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 4,
            ],
            [
                'code' => 'NET90',
                'name' => 'Netto 90 giorni dfm',
                'description' => 'Pagamento a 90 giorni data fine mese',
                'days' => 90,
                'payment_type' => 'bank_transfer',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 5,
            ],
            [
                'code' => 'RIBA30',
                'name' => 'Ri.Ba. 30 giorni',
                'description' => 'Ricevuta bancaria a 30 giorni',
                'days' => 30,
                'payment_type' => 'riba',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 6,
            ],
            [
                'code' => 'RIBA60',
                'name' => 'Ri.Ba. 60 giorni',
                'description' => 'Ricevuta bancaria a 60 giorni',
                'days' => 60,
                'payment_type' => 'riba',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 7,
            ],
            [
                'code' => 'RIBA90',
                'name' => 'Ri.Ba. 90 giorni',
                'description' => 'Ricevuta bancaria a 90 giorni',
                'days' => 90,
                'payment_type' => 'riba',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 8,
            ],
            [
                'code' => 'CC',
                'name' => 'Carta di Credito',
                'description' => 'Pagamento con carta di credito',
                'days' => 0,
                'payment_type' => 'credit_card',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 9,
            ],
            [
                'code' => 'CHECK30',
                'name' => 'Assegno 30 giorni',
                'description' => 'Pagamento con assegno a 30 giorni',
                'days' => 30,
                'payment_type' => 'check',
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 10,
            ],
        ];

        foreach ($terms as $term) {
            PaymentTerm::updateOrCreate(
                ['code' => $term['code']],
                $term
            );
        }
    }
}
