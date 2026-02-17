<?php

namespace Database\Seeders;

use App\Models\WarrantyType;
use Illuminate\Database\Seeder;

class WarrantyTypeSeeder extends Seeder
{
    /**
     * Seed warranty types for the quote system.
     */
    public function run(): void
    {
        $warranties = [
            [
                'name' => '2 anni materiali e installazione',
                'years' => 2,
                'description' => 'Garanzia di 2 anni dalla data di consegna su materiali forniti e installazione secondo normativa vigente.',
                'exclusions' => [
                    'Uso improprio o non conforme alle istruzioni',
                    'Manomissioni o modifiche non autorizzate',
                    'Interventi di terzi non autorizzati',
                    'Atti volontari o dolosi',
                    'Eventi accidentali esterni',
                    'Cause di forza maggiore (calamità naturali, etc.)',
                    'Mancata manutenzione ordinaria',
                    'Normale usura dei materiali',
                ],
                'is_default' => true,
                'is_active' => true,
                'sort_order' => 1,
            ],
            [
                'name' => '5 anni estesa',
                'years' => 5,
                'description' => 'Garanzia estesa di 5 anni su materiali e manodopera per installazioni certificate.',
                'exclusions' => [
                    'Uso improprio',
                    'Manomissioni',
                    'Mancata manutenzione certificata annuale',
                ],
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 2,
            ],
            [
                'name' => '1 anno base',
                'years' => 1,
                'description' => 'Garanzia base di 1 anno su difetti di fabbricazione.',
                'exclusions' => [
                    'Installazione non eseguita da DGGM',
                    'Uso improprio',
                ],
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 3,
            ],
            [
                'name' => 'Nessuna garanzia',
                'years' => null,
                'description' => 'Fornitura senza garanzia (vendita allo stato).',
                'exclusions' => [],
                'is_default' => false,
                'is_active' => true,
                'sort_order' => 99,
            ],
        ];

        foreach ($warranties as $warranty) {
            WarrantyType::updateOrCreate(
                ['name' => $warranty['name']],
                $warranty
            );
        }

        $this->command->info('Created '.count($warranties).' warranty types');
    }
}
