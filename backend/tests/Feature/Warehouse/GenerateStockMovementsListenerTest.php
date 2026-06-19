<?php

use App\Domains\Product\Enums\ProductRelationQuantityType;
use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductRelationType;
use App\Domains\Warehouse\Models\Ddt;
use App\Domains\Warehouse\Models\DdtItem;
use App\Domains\Warehouse\Models\Inventory;
use App\Domains\Warehouse\Models\StockMovement;
use App\Domains\Warehouse\Models\Warehouse;
use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Enums\StockMovementType;
use App\Events\DdtConfirmed;
use App\Events\StockMovementCreated;
use App\Models\User;
use Database\Factories\ProductFactory;
use Database\Factories\WarehouseFactory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

uses(Tests\TestCase::class, RefreshDatabase::class);

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeWarehouse(string $name = 'WH-A'): Warehouse
{
    return WarehouseFactory::new()->create(['name' => $name]);
}

function makeProduct(array $attrs = []): Product
{
    return ProductFactory::new()->create(array_merge(['product_type' => ProductType::ARTICLE], $attrs));
}

function makeInventory(Product $product, Warehouse $warehouse, array $qty = []): Inventory
{
    return Inventory::create(array_merge([
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'quantity_available' => 100,
        'quantity_reserved' => 0,
        'quantity_in_transit' => 0,
        'quantity_quarantine' => 0,
        'quantity_out_on_rental' => 0,
    ], $qty));
}

function makeDdt(Warehouse $warehouse, DdtType $type, array $attrs = []): Ddt
{
    $user = User::factory()->create();

    return Ddt::create(array_merge([
        'code' => 'TEST-'.fake()->unique()->numerify('####'),
        'ddt_number' => fake()->unique()->numerify('DDT-####'),
        'type' => $type,
        'from_warehouse_id' => $warehouse->id,
        'ddt_date' => now()->toDateString(),
        'created_by' => $user->id,
        'status' => DdtStatus::Draft,
    ], $attrs));
}

function addItem(Ddt $ddt, Product $product, float $qty = 5, ?float $unitCost = 10.0): DdtItem
{
    return DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $product->id,
        'quantity' => $qty,
        'unit' => 'pz',
        'unit_cost' => $unitCost,
    ]);
}

function confirmDdt(Ddt $ddt): void
{
    DdtConfirmed::dispatch($ddt);
}

function makeComponentRelationType(): ProductRelationType
{
    return ProductRelationType::firstOrCreate(
        ['code' => 'component'],
        ['name' => 'Componente', 'icon' => 'package', 'color' => '#3B82F6', 'sort_order' => 1]
    );
}

// ─── Incoming ───────────────────────────────────────────────────────────────

it('incoming DDT creates INTAKE movement and increases quantity_available', function () {
    $wh = makeWarehouse();
    $product = makeProduct();
    $ddt = makeDdt($wh, DdtType::Incoming);
    addItem($ddt, $product, 10, 50.00);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->first())
        ->not->toBeNull()
        ->type->toBe(StockMovementType::INTAKE)
        ->warehouse_id->toBe($wh->id);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 10,
    ]);
});

it('incoming DDT adds to existing stock', function () {
    $wh = makeWarehouse();
    $product = makeProduct();
    makeInventory($product, $wh, ['quantity_available' => 30]);
    $ddt = makeDdt($wh, DdtType::Incoming);
    addItem($ddt, $product, 20);

    confirmDdt($ddt);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 50,
    ]);
});

it('incoming DDT dispatches StockMovementCreated', function () {
    Event::fake([StockMovementCreated::class]);

    $wh = makeWarehouse();
    $product = makeProduct();
    $ddt = makeDdt($wh, DdtType::Incoming);
    addItem($ddt, $product, 5);

    confirmDdt($ddt);

    Event::assertDispatched(StockMovementCreated::class);
});

// ─── Outgoing ───────────────────────────────────────────────────────────────

it('outgoing DDT creates OUTPUT movement and decreases quantity_available', function () {
    $wh = makeWarehouse();
    $product = makeProduct();
    makeInventory($product, $wh, ['quantity_available' => 50]);
    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $product, 15);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->first())
        ->type->toBe(StockMovementType::OUTPUT);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 35,
    ]);
});

it('outgoing DDT does not touch quantity_out_on_rental', function () {
    $wh = makeWarehouse();
    $product = makeProduct();
    makeInventory($product, $wh, ['quantity_available' => 50, 'quantity_out_on_rental' => 5]);
    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $product, 10);

    confirmDdt($ddt);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 40,
        'quantity_out_on_rental' => 5,
    ]);
});

// ─── Internal (Transfer) ────────────────────────────────────────────────────

it('internal DDT creates two TRANSFER movements and moves stock between warehouses', function () {
    $whA = makeWarehouse('WH-A');
    $whB = makeWarehouse('WH-B');
    $product = makeProduct();
    makeInventory($product, $whA, ['quantity_available' => 40]);
    $ddt = makeDdt($whA, DdtType::Internal, ['to_warehouse_id' => $whB->id]);
    addItem($ddt, $product, 10);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->count())->toBe(2);
    expect(StockMovement::where('ddt_id', $ddt->id)->where('type', StockMovementType::TRANSFER)->count())->toBe(2);

    $this->assertDatabaseHas('inventory', ['product_id' => $product->id, 'warehouse_id' => $whA->id, 'quantity_available' => 30]);
    $this->assertDatabaseHas('inventory', ['product_id' => $product->id, 'warehouse_id' => $whB->id, 'quantity_available' => 10]);
});

// ─── Rental Out ─────────────────────────────────────────────────────────────

it('rental_out DDT creates RENTAL_OUT movement and increments quantity_out_on_rental only', function () {
    $wh = makeWarehouse();
    $product = makeProduct(['is_rentable' => true]);
    makeInventory($product, $wh, ['quantity_available' => 20, 'quantity_out_on_rental' => 0]);
    $ddt = makeDdt($wh, DdtType::RentalOut);
    addItem($ddt, $product, 5);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->first())
        ->type->toBe(StockMovementType::RENTAL_OUT);

    // Modello B: fleet (quantity_available) unchanged
    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 20,
        'quantity_out_on_rental' => 5,
    ]);
});

it('rental_out DDT creates inventory record if none exists', function () {
    $wh = makeWarehouse();
    $product = makeProduct(['is_rentable' => true]);
    $ddt = makeDdt($wh, DdtType::RentalOut);
    addItem($ddt, $product, 3);

    confirmDdt($ddt);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_out_on_rental' => 3,
    ]);
});

// ─── Rental Return ───────────────────────────────────────────────────────────

it('rental_return DDT creates RENTAL_RETURN movement and decrements quantity_out_on_rental', function () {
    $wh = makeWarehouse();
    $product = makeProduct(['is_rentable' => true]);
    makeInventory($product, $wh, ['quantity_available' => 20, 'quantity_out_on_rental' => 8]);
    $ddt = makeDdt($wh, DdtType::RentalReturn);
    addItem($ddt, $product, 5);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->first())
        ->type->toBe(StockMovementType::RENTAL_RETURN);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 20,
        'quantity_out_on_rental' => 3,
    ]);
});

it('rental_return still creates movement even when inventory is missing', function () {
    $wh = makeWarehouse();
    $product = makeProduct(['is_rentable' => true]);
    $ddt = makeDdt($wh, DdtType::RentalReturn);
    addItem($ddt, $product, 5);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->count())->toBe(1);
});

// ─── Return from Customer ────────────────────────────────────────────────────

it('return_from_customer DDT creates RETURN movement and increases quantity_available', function () {
    $wh = makeWarehouse();
    $product = makeProduct();
    makeInventory($product, $wh, ['quantity_available' => 10]);
    $ddt = makeDdt($wh, DdtType::ReturnFromCustomer);
    addItem($ddt, $product, 4);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->first())
        ->type->toBe(StockMovementType::RETURN);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 14,
    ]);
});

// ─── Return to Supplier ──────────────────────────────────────────────────────

it('return_to_supplier DDT creates RETURN movement and decreases quantity_available', function () {
    $wh = makeWarehouse();
    $product = makeProduct();
    makeInventory($product, $wh, ['quantity_available' => 20]);
    $ddt = makeDdt($wh, DdtType::ReturnToSupplier);
    addItem($ddt, $product, 6);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->first())
        ->type->toBe(StockMovementType::RETURN);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $product->id,
        'warehouse_id' => $wh->id,
        'quantity_available' => 14,
    ]);
});

// ─── Multiple Items ───────────────────────────────────────────────────────────

it('processes all items in a DDT', function () {
    $wh = makeWarehouse();
    $p1 = makeProduct(['code' => 'P1']);
    $p2 = makeProduct(['code' => 'P2']);
    $ddt = makeDdt($wh, DdtType::Incoming);
    addItem($ddt, $p1, 10);
    addItem($ddt, $p2, 20);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->count())->toBe(2);
    $this->assertDatabaseHas('inventory', ['product_id' => $p1->id, 'quantity_available' => 10]);
    $this->assertDatabaseHas('inventory', ['product_id' => $p2->id, 'quantity_available' => 20]);
});

// ─── BOM Explosion ───────────────────────────────────────────────────────────

it('outgoing DDT explodes COMPOSITE BOM and creates KIT_ASSEMBLY movements for components', function () {
    $wh = makeWarehouse();
    $relType = makeComponentRelationType();

    $parent = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'PARENT']);
    $component = makeProduct(['product_type' => ProductType::ARTICLE, 'code' => 'COMP']);

    $parent->relations()->create([
        'related_product_id' => $component->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '2',
        'is_required_for_stock' => true,
    ]);

    makeInventory($parent, $wh, ['quantity_available' => 50]);
    makeInventory($component, $wh, ['quantity_available' => 100]);

    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $parent, 5);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->where('product_id', $parent->id)->where('type', StockMovementType::OUTPUT)->count())->toBe(1);

    $compMovement = StockMovement::where('ddt_id', $ddt->id)
        ->where('product_id', $component->id)
        ->where('type', StockMovementType::KIT_ASSEMBLY)
        ->first();

    expect($compMovement)->not->toBeNull()
        ->and((float) $compMovement->quantity)->toBe(10.0);

    $this->assertDatabaseHas('inventory', ['product_id' => $component->id, 'warehouse_id' => $wh->id, 'quantity_available' => 90]);
    $this->assertDatabaseHas('inventory', ['product_id' => $parent->id, 'warehouse_id' => $wh->id, 'quantity_available' => 45]);
});

it('incoming DDT explodes COMPOSITE BOM and creates KIT_DISASSEMBLY movements (FIXED qty)', function () {
    $wh = makeWarehouse();
    $relType = makeComponentRelationType();

    $parent = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'PARENT-IN']);
    $component = makeProduct(['product_type' => ProductType::ARTICLE, 'code' => 'COMP-IN']);

    $parent->relations()->create([
        'related_product_id' => $component->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::FIXED,
        'quantity_value' => '3',
        'is_required_for_stock' => true,
    ]);

    $ddt = makeDdt($wh, DdtType::Incoming);
    addItem($ddt, $parent, 4);

    confirmDdt($ddt);

    $compMovement = StockMovement::where('ddt_id', $ddt->id)
        ->where('product_id', $component->id)
        ->where('type', StockMovementType::KIT_DISASSEMBLY)
        ->first();

    expect($compMovement)->not->toBeNull()
        ->and((float) $compMovement->quantity)->toBe(3.0); // FIXED: always 3, not 4*3
});

it('BOM explosion dispatches StockMovementCreated for component movements', function () {
    Event::fake([StockMovementCreated::class]);

    $wh = makeWarehouse();
    $relType = makeComponentRelationType();

    $parent = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'PARENT-EV']);
    $component = makeProduct(['product_type' => ProductType::ARTICLE, 'code' => 'COMP-EV']);

    $parent->relations()->create([
        'related_product_id' => $component->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '1',
        'is_required_for_stock' => true,
    ]);

    makeInventory($parent, $wh, ['quantity_available' => 20]);

    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $parent, 2);

    confirmDdt($ddt);

    // 1 for parent OUTPUT + 1 for component KIT_ASSEMBLY
    Event::assertDispatched(StockMovementCreated::class, 2);
});

it('BOM explosion skips components without is_required_for_stock', function () {
    $wh = makeWarehouse();
    $relType = makeComponentRelationType();

    $parent = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'PARENT-SKIP']);
    $component = makeProduct(['product_type' => ProductType::ARTICLE, 'code' => 'COMP-SKIP']);

    $parent->relations()->create([
        'related_product_id' => $component->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '2',
        'is_required_for_stock' => false,
    ]);

    makeInventory($parent, $wh, ['quantity_available' => 20]);
    makeInventory($component, $wh, ['quantity_available' => 50]);

    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $parent, 3);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->count())->toBe(1);
    $this->assertDatabaseHas('inventory', ['product_id' => $component->id, 'quantity_available' => 50]);
});

it('BOM explosion is recursive for nested COMPOSITE components', function () {
    $wh = makeWarehouse();
    $relType = makeComponentRelationType();

    $parent = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'PARENT-REC']);
    $subComposite = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'SUB-COMP']);
    $leaf = makeProduct(['product_type' => ProductType::ARTICLE, 'code' => 'LEAF']);

    $parent->relations()->create([
        'related_product_id' => $subComposite->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '2',
        'is_required_for_stock' => true,
    ]);

    $subComposite->relations()->create([
        'related_product_id' => $leaf->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '3',
        'is_required_for_stock' => true,
    ]);

    makeInventory($parent, $wh, ['quantity_available' => 20]);
    makeInventory($subComposite, $wh, ['quantity_available' => 50]);
    makeInventory($leaf, $wh, ['quantity_available' => 200]);

    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $parent, 1);

    confirmDdt($ddt);

    // parent qty=1 → subComposite qty=2 → leaf qty=6
    expect((float) StockMovement::where('ddt_id', $ddt->id)->where('product_id', $subComposite->id)->first()->quantity)->toBe(2.0);
    expect((float) StockMovement::where('ddt_id', $ddt->id)->where('product_id', $leaf->id)->first()->quantity)->toBe(6.0);

    $this->assertDatabaseHas('inventory', ['product_id' => $subComposite->id, 'quantity_available' => 48]);
    $this->assertDatabaseHas('inventory', ['product_id' => $leaf->id, 'quantity_available' => 194]);
});

it('BOM explosion processes KIT component as leaf (no further recursion)', function () {
    $wh = makeWarehouse();
    $relType = makeComponentRelationType();

    // COMPOSITE parent → KIT component: the KIT gets a movement but is not further exploded
    // (KIT products cannot have component relations per domain validation)
    $parent = makeProduct(['product_type' => ProductType::COMPOSITE, 'code' => 'PARENT-KIT']);
    $kitComponent = makeProduct(['product_type' => ProductType::KIT, 'code' => 'KIT-COMP']);

    $parent->relations()->create([
        'related_product_id' => $kitComponent->id,
        'relation_type_id' => $relType->id,
        'quantity_type' => ProductRelationQuantityType::MULTIPLIED,
        'quantity_value' => '2',
        'is_required_for_stock' => true,
    ]);

    makeInventory($parent, $wh, ['quantity_available' => 10]);
    makeInventory($kitComponent, $wh, ['quantity_available' => 10]);

    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $parent, 1);

    confirmDdt($ddt);

    // KIT component gets its own KIT_ASSEMBLY movement
    expect(StockMovement::where('ddt_id', $ddt->id)->where('product_id', $kitComponent->id)->exists())->toBeTrue();
    // KIT component inventory is decremented (quantity 2)
    $this->assertDatabaseHas('inventory', ['product_id' => $kitComponent->id, 'quantity_available' => 8]);
    // Only 2 movements total: parent OUTPUT + kitComponent KIT_ASSEMBLY
    expect(StockMovement::where('ddt_id', $ddt->id)->count())->toBe(2);
});

it('ARTICLE product does not trigger BOM explosion', function () {
    $wh = makeWarehouse();
    $product = makeProduct(['product_type' => ProductType::ARTICLE]);
    makeInventory($product, $wh);
    $ddt = makeDdt($wh, DdtType::Outgoing);
    addItem($ddt, $product, 5);

    confirmDdt($ddt);

    expect(StockMovement::where('ddt_id', $ddt->id)->count())->toBe(1);
});
