<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Data\DdtData;
use App\Data\DdtItemData;

echo "=== TEST VALIDAZIONE DDT ===\n\n";

try {
    // Test 1: Item senza ddt_id
    echo "Test 1: DdtItemData senza ddt_id\n";
    $item = DdtItemData::from([
        'product_id' => 1,
        'quantity' => 10,
        'unit' => 'pz',
        'unit_cost' => 100,
    ]);
    echo "✅ Item creato con successo\n";
    echo "   ddt_id è Optional: " . ($item->ddt_id instanceof \Spatie\LaravelData\Optional ? 'YES' : 'NO') . "\n\n";

    // Test 2: DdtData con items
    echo "Test 2: DdtData con items (senza ddt_id)\n";
    $ddtData = DdtData::from([
        'type' => 'outgoing',
        'from_warehouse_id' => 1,
        'ddt_number' => 'TEST-001',
        'ddt_date' => '2026-01-23',
        'items' => [
            [
                'product_id' => 1,
                'quantity' => 5,
                'unit' => 'pz',
                'unit_cost' => 50,
            ]
        ]
    ]);
    echo "✅ DdtData creato con successo\n";
    echo "   Numero items: " . $ddtData->items->count() . "\n";
    echo "   Items è DataCollection: " . ($ddtData->items instanceof \Spatie\LaravelData\DataCollection ? 'YES' : 'NO') . "\n\n";

    // Test 3: Simulazione CreateDdtAction
    echo "Test 3: Simulazione CreateDdtAction (except)\n";
    foreach ($ddtData->items as $itemData) {
        $arrayForCreate = $itemData->except('id', 'ddt_id')->toArray();
        echo "✅ Array per create generato correttamente\n";
        echo "   Keys: " . implode(', ', array_keys($arrayForCreate)) . "\n";
    }

    echo "\n🎉 TUTTI I TEST PASSATI!\n";

} catch (\Exception $e) {
    echo "\n❌ ERRORE: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
