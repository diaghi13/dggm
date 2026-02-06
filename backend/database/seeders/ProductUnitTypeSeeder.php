<?php

namespace Database\Seeders;

use App\Models\ProductUnitType;
use Illuminate\Database\Seeder;

class ProductUnitTypeSeeder extends Seeder
{
    /**
     * Seed product unit types with IT/EN mapping and aliases
     */
    public function run(): void
    {
        $units = [
            // COUNT
            [
                'code' => 'pz',
                'name_it' => 'Pezzo',
                'symbol_it' => 'pz',
                'name_en' => 'Piece',
                'symbol_en' => 'pce',
                'aliases' => ['pc', 'pce', 'piece', 'pezzo', 'pcs', 'pieces'],
                'category' => 'count',
                'conversion_factor' => 1,
                'sort_order' => 10,
            ],
            [
                'code' => 'paia',
                'name_it' => 'Paio',
                'symbol_it' => 'paia',
                'name_en' => 'Pair',
                'symbol_en' => 'pair',
                'aliases' => ['pair', 'pairs', 'paia'],
                'category' => 'count',
                'conversion_factor' => 2,
                'sort_order' => 20,
            ],
            [
                'code' => 'set',
                'name_it' => 'Set',
                'symbol_it' => 'set',
                'name_en' => 'Set',
                'symbol_en' => 'set',
                'aliases' => ['set', 'sets', 'kit'],
                'category' => 'count',
                'conversion_factor' => 1,
                'sort_order' => 30,
            ],

            // LENGTH
            [
                'code' => 'mm',
                'name_it' => 'Millimetro',
                'symbol_it' => 'mm',
                'name_en' => 'Millimeter',
                'symbol_en' => 'mm',
                'aliases' => ['millimeter', 'millimetre', 'millimetri'],
                'category' => 'length',
                'conversion_factor' => 0.001,
                'sort_order' => 40,
            ],
            [
                'code' => 'cm',
                'name_it' => 'Centimetro',
                'symbol_it' => 'cm',
                'name_en' => 'Centimeter',
                'symbol_en' => 'cm',
                'aliases' => ['centimeter', 'centimetre', 'centimetri'],
                'category' => 'length',
                'conversion_factor' => 0.01,
                'sort_order' => 50,
            ],
            [
                'code' => 'mt',
                'name_it' => 'Metro',
                'symbol_it' => 'mt',
                'name_en' => 'Meter',
                'symbol_en' => 'm',
                'aliases' => ['m', 'meter', 'metre', 'metri', 'meters'],
                'category' => 'length',
                'conversion_factor' => 1,
                'sort_order' => 60,
            ],
            [
                'code' => 'km',
                'name_it' => 'Chilometro',
                'symbol_it' => 'km',
                'name_en' => 'Kilometer',
                'symbol_en' => 'km',
                'aliases' => ['kilometer', 'kilometre', 'chilometri'],
                'category' => 'length',
                'conversion_factor' => 1000,
                'sort_order' => 70,
            ],

            // WEIGHT
            [
                'code' => 'g',
                'name_it' => 'Grammo',
                'symbol_it' => 'g',
                'name_en' => 'Gram',
                'symbol_en' => 'g',
                'aliases' => ['gram', 'grams', 'grammi'],
                'category' => 'weight',
                'conversion_factor' => 0.001,
                'sort_order' => 80,
            ],
            [
                'code' => 'kg',
                'name_it' => 'Chilogrammo',
                'symbol_it' => 'kg',
                'name_en' => 'Kilogram',
                'symbol_en' => 'kg',
                'aliases' => ['kilogram', 'kilograms', 'chilogrammi'],
                'category' => 'weight',
                'conversion_factor' => 1,
                'sort_order' => 90,
            ],
            [
                'code' => 't',
                'name_it' => 'Tonnellata',
                'symbol_it' => 't',
                'name_en' => 'Ton',
                'symbol_en' => 't',
                'aliases' => ['ton', 'tons', 'tonnellata', 'tonnellate'],
                'category' => 'weight',
                'conversion_factor' => 1000,
                'sort_order' => 100,
            ],

            // AREA
            [
                'code' => 'm2',
                'name_it' => 'Metro Quadrato',
                'symbol_it' => 'm²',
                'name_en' => 'Square Meter',
                'symbol_en' => 'm²',
                'aliases' => ['sqm', 'm²', 'm2', 'mq', 'square meter', 'metri quadrati'],
                'category' => 'area',
                'conversion_factor' => 1,
                'sort_order' => 110,
            ],

            // VOLUME
            [
                'code' => 'ml',
                'name_it' => 'Millilitro',
                'symbol_it' => 'ml',
                'name_en' => 'Milliliter',
                'symbol_en' => 'ml',
                'aliases' => ['milliliter', 'millilitre', 'millilitri'],
                'category' => 'volume',
                'conversion_factor' => 0.001,
                'sort_order' => 120,
            ],
            [
                'code' => 'l',
                'name_it' => 'Litro',
                'symbol_it' => 'l',
                'name_en' => 'Liter',
                'symbol_en' => 'l',
                'aliases' => ['liter', 'litre', 'litri', 'liters'],
                'category' => 'volume',
                'conversion_factor' => 1,
                'sort_order' => 130,
            ],
            [
                'code' => 'm3',
                'name_it' => 'Metro Cubo',
                'symbol_it' => 'm³',
                'name_en' => 'Cubic Meter',
                'symbol_en' => 'm³',
                'aliases' => ['cbm', 'm³', 'm3', 'mc', 'cubic meter', 'metri cubi'],
                'category' => 'volume',
                'conversion_factor' => 1000,
                'sort_order' => 140,
            ],

            // TIME
            [
                'code' => 'h',
                'name_it' => 'Ora',
                'symbol_it' => 'h',
                'name_en' => 'Hour',
                'symbol_en' => 'h',
                'aliases' => ['hour', 'hours', 'ore', 'hr', 'hrs'],
                'category' => 'time',
                'conversion_factor' => 1,
                'sort_order' => 150,
            ],
            [
                'code' => 'gg',
                'name_it' => 'Giorno',
                'symbol_it' => 'gg',
                'name_en' => 'Day',
                'symbol_en' => 'd',
                'aliases' => ['day', 'days', 'giorni', 'd'],
                'category' => 'time',
                'conversion_factor' => 24,
                'sort_order' => 160,
            ],
        ];

        foreach ($units as $unit) {
            ProductUnitType::firstOrCreate(
                ['code' => $unit['code']],
                $unit
            );
        }
    }
}
