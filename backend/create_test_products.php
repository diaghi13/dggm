<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Enums\ProductRelationQuantityType;
use App\Enums\ProductType;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\ProductRelation;
use App\Models\ProductRelationType;

// Get categories
$electricalCategory = ProductCategory::where('code', 'electrical')->first();
$containerCategory = ProductCategory::where('code', 'containers')->first();

// Get relation types
$accessoryRelationType = ProductRelationType::where('code', 'accessory')->first();
$containerRelationType = ProductRelationType::where('code', 'container')->first();
$componentRelationType = ProductRelationType::where('code', 'component')->first();

echo "=== Creating Test Products ===\n\n";

// 1. SmartBat S300 (prodotto principale)
$smartbat = Product::updateOrCreate(
    ['code' => 'SMARTBAT-S300'],
    [
        'name' => 'SmartBat S300',
        'description' => 'Smart battery system 300W',
        'category_id' => $electricalCategory->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 450.00,
        'sale_price' => 850.00,
        'is_active' => true,
    ]
);
echo "✅ Created SmartBat S300 (ID: {$smartbat->id})\n";

// 2. Cavo Alimentazione
$cable = Product::updateOrCreate(
    ['code' => 'CABLE-SMARTBAT'],
    [
        'name' => 'Cavo Alimentazione SmartBat',
        'description' => 'Power cable for SmartBat',
        'category_id' => $electricalCategory->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 15.00,
        'sale_price' => 25.00,
        'is_active' => true,
    ]
);
echo "✅ Created Cavo Alimentazione (ID: {$cable->id})\n";

// 3. Baule Trasporto
$container = Product::updateOrCreate(
    ['code' => 'CONTAINER-6PZ'],
    [
        'name' => 'Baule Trasporto 6pz',
        'description' => 'Container for 6 SmartBat units',
        'category_id' => $containerCategory->id,
        'product_type' => ProductType::ARTICLE,
        'unit' => 'pz',
        'purchase_price' => 120.00,
        'sale_price' => 0.00, // Non venduto, solo uso interno
        'is_active' => true,
    ]
);
echo "✅ Created Baule Trasporto (ID: {$container->id})\n\n";

// 4. Prodotto COMPOSITE per test (Kit SmartBat)
$kit = Product::updateOrCreate(
    ['code' => 'KIT-SMARTBAT-2'],
    [
        'name' => 'Kit SmartBat 2pz',
        'description' => 'Kit with 2 SmartBat units',
        'category_id' => $electricalCategory->id,
        'product_type' => ProductType::COMPOSITE,
        'unit' => 'kit',
        'purchase_price' => 900.00, // 2x450 (calcolato da componenti)
        'sale_price' => 1600.00, // Prezzo kit (sconto rispetto a 2x850)
        'is_active' => true,
    ]
);
echo "✅ Created Kit SmartBat 2pz (ID: {$kit->id})\n\n";

echo "=== Creating Product Relations ===\n\n";

// Relazione 1: SmartBat richiede Cavo (ACCESSORIO)
$relation1 = ProductRelation::updateOrCreate(
    [
        'product_id' => $smartbat->id,
        'related_product_id' => $cable->id,
        'relation_type_id' => $accessoryRelationType->id,
    ],
    [
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '1', // 1:1 ratio
        'is_visible_in_quote' => true,       // ✅ LISTA 1: Cliente lo vede
        'is_visible_in_material_list' => true,  // ✅ LISTA 2: Operai lo installano
        'is_required_for_stock' => true,        // ✅ LISTA 3: Scarico magazzino
        'is_optional' => false,
        'sort_order' => 1,
        'notes' => 'Cavo necessario per alimentazione',
    ]
);
echo "✅ Created relation: SmartBat → Cavo (accessory, multiplied x1)\n";

// Relazione 2: SmartBat richiede Baule (CONTAINER con formula)
$relation2 = ProductRelation::updateOrCreate(
    [
        'product_id' => $smartbat->id,
        'related_product_id' => $container->id,
        'relation_type_id' => $containerRelationType->id,
    ],
    [
        'quantity_type' => ProductRelationQuantityType::FORMULA,
        'quantity_value' => 'ceil(qty/6)', // 1 baule ogni 6 pezzi
        'is_visible_in_quote' => false,         // ❌ LISTA 1: NON in preventivo
        'is_visible_in_material_list' => false, // ❌ LISTA 2: NON in cantiere
        'is_required_for_stock' => true,        // ✅ LISTA 3: Solo magazzino
        'is_optional' => true, // Opzionale (chiede conferma)
        'sort_order' => 2,
        'notes' => 'Baule per trasporto, 1 ogni 6 pezzi',
    ]
);
echo "✅ Created relation: SmartBat → Baule (container, formula ceil(qty/6))\n\n";

// Relazione 3: Kit contiene 2 SmartBat (COMPONENTE)
$relation3 = ProductRelation::updateOrCreate(
    [
        'product_id' => $kit->id,
        'related_product_id' => $smartbat->id,
        'relation_type_id' => $componentRelationType->id,
    ],
    [
        'quantity_type' => ProductRelationQuantityType::FIXED,
        'quantity_value' => '2', // Kit contiene 2 SmartBat
        'is_visible_in_quote' => true,       // ✅ LISTA 1: Componenti visibili
        'is_visible_in_material_list' => true,  // ✅ LISTA 2: Operai vedono componenti
        'is_required_for_stock' => true,        // ✅ LISTA 3: Scarico componenti
        'is_optional' => false,
        'sort_order' => 1,
        'notes' => 'Kit contiene 2 unità SmartBat',
    ]
);
echo "✅ Created relation: Kit → SmartBat (component, fixed x2)\n\n";

echo "=== Test Data Summary ===\n\n";
echo "Products created:\n";
echo "  - SmartBat S300 (ID: {$smartbat->id}) - €850\n";
echo "  - Cavo Alimentazione (ID: {$cable->id}) - €25\n";
echo "  - Baule Trasporto 6pz (ID: {$container->id}) - €0 (uso interno)\n";
echo "  - Kit SmartBat 2pz (ID: {$kit->id}) - €1600 (COMPOSITE)\n\n";

echo "Relations created:\n";
echo "  1. SmartBat → Cavo (accessory, 1:1, visible everywhere)\n";
echo "  2. SmartBat → Baule (container, ceil(qty/6), stock only)\n";
echo "  3. Kit → SmartBat (component, fixed 2pz)\n\n";

echo "✅ Test data creation complete!\n\n";

echo "Test with:\n";
echo "  php artisan tinker --execute=\"echo json_encode(\\App\\Models\\Product::where('code', 'SMARTBAT-S300')->first()->calculateAllRelations(8), JSON_PRETTY_PRINT);\"\n";
