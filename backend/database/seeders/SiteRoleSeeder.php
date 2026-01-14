<?php

namespace Database\Seeders;

use App\Models\SiteRole;
use Illuminate\Database\Seeder;

class SiteRoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            [
                'name' => 'Caposquadra',
                'slug' => 'caposquadra',
                'description' => 'Responsabile della squadra e coordinamento lavori',
                'color' => '#EF4444', // red
                'sort_order' => 10,
            ],
            [
                'name' => 'Operaio Generico',
                'slug' => 'operaio-generico',
                'description' => 'Operaio per lavori generici',
                'color' => '#3B82F6', // blue
                'sort_order' => 20,
            ],
            [
                'name' => 'Operaio Specializzato',
                'slug' => 'operaio-specializzato',
                'description' => 'Operaio con specializzazione tecnica',
                'color' => '#8B5CF6', // purple
                'sort_order' => 30,
            ],
            [
                'name' => 'Muratore',
                'slug' => 'muratore',
                'description' => 'Specialista in lavori murari',
                'color' => '#F59E0B', // amber
                'sort_order' => 40,
            ],
            [
                'name' => 'Elettricista',
                'slug' => 'elettricista',
                'description' => 'Specialista in impianti elettrici',
                'color' => '#FBBF24', // yellow
                'sort_order' => 50,
            ],
            [
                'name' => 'Idraulico',
                'slug' => 'idraulico',
                'description' => 'Specialista in impianti idraulici',
                'color' => '#06B6D4', // cyan
                'sort_order' => 60,
            ],
            [
                'name' => 'Fonico',
                'slug' => 'fonico',
                'description' => 'Tecnico audio e impianti sonori',
                'color' => '#10B981', // emerald
                'sort_order' => 70,
            ],
            [
                'name' => 'Datore Luci',
                'slug' => 'datore-luci',
                'description' => 'Tecnico luci e impianti illuminotecnici',
                'color' => '#F472B6', // pink
                'sort_order' => 80,
            ],
            [
                'name' => 'Facchino',
                'slug' => 'facchino',
                'description' => 'Addetto al trasporto e movimentazione materiali',
                'color' => '#9CA3AF', // gray
                'sort_order' => 90,
            ],
            [
                'name' => 'Runner',
                'slug' => 'runner',
                'description' => 'Aiutante generico e supporto logistico',
                'color' => '#94A3B8', // slate
                'sort_order' => 100,
            ],
            [
                'name' => 'Carpentiere',
                'slug' => 'carpentiere',
                'description' => 'Specialista in lavori di carpenteria',
                'color' => '#78350F', // brown
                'sort_order' => 110,
            ],
            [
                'name' => 'Pittore',
                'slug' => 'pittore',
                'description' => 'Specialista in tinteggiatura e verniciatura',
                'color' => '#EC4899', // fuchsia
                'sort_order' => 120,
            ],
        ];

        foreach ($roles as $roleData) {
            SiteRole::updateOrCreate(
                ['slug' => $roleData['slug']],
                $roleData
            );
        }
    }
}
