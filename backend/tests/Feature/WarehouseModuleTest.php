<?php

use App\Actions\Ddt\CancelDdtAction;
use App\Actions\Ddt\ConfirmDdtAction;
use App\Actions\Ddt\CreateDdtAction;
use App\Actions\Ddt\DeliverDdtAction;
use App\Actions\Inventory\AdjustInventoryAction;
use App\Actions\Inventory\ReleaseInventoryReservationAction;
use App\Actions\Inventory\ReserveInventoryAction;
use App\Data\DdtData;
use App\Data\DdtItemData;
use App\Data\InventoryData;
use App\Enums\DdtStatus;
use App\Enums\DdtType;
use App\Enums\StockMovementType;
use App\Events\DdtCancelled;
use App\Events\DdtConfirmed;
use App\Events\DdtCreated;
use App\Events\DdtDelivered;
use App\Events\InventoryAdjusted;
use App\Events\InventoryReserved;
use App\Events\InventoryReservationReleased;
use App\Events\StockMovementCreated;
use App\Models\Ddt;
use App\Models\DdtItem;
use App\Models\Inventory;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;

use function Pest\Laravel\actingAs;

uses(\Tests\TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->artisan('db:seed', ['--class' => 'RoleAndPermissionSeeder']);

    // Create test user
    $this->user = User::factory()->create();
    $this->user->assignRole('admin');
    actingAs($this->user);

    // Create test data
    $this->warehouse1 = Warehouse::factory()->create(['name' => 'Warehouse A']);
    $this->warehouse2 = Warehouse::factory()->create(['name' => 'Warehouse B']);
    $this->product1 = Product::factory()->create(['name' => 'Product 1', 'code' => 'P001']);
    $this->product2 = Product::factory()->create(['name' => 'Product 2', 'code' => 'P002']);
    $this->supplier = Supplier::factory()->create(['company_name' => 'Supplier A']);
});

// ==========================================
// INVENTORY TESTS
// ==========================================

it('can adjust inventory and dispatch event', function () {
    Event::fake([InventoryAdjusted::class]);

    $action = app(AdjustInventoryAction::class);

    $data = InventoryData::from([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
    ]);

    $movement = $action->execute(
        $data->product_id,
        $data->warehouse_id,
        100.0,
        $this->product1->purchase_price,
        'Initial stock adjustment'
    );

    expect($movement)->not->toBeNull()
        ->and($movement->product_id)->toBe($this->product1->id)
        ->and($movement->warehouse_id)->toBe($this->warehouse1->id)
        ->and($movement->type)->toBe(StockMovementType::ADJUSTMENT)
        ->and($movement->quantity)->toBe('100.00');

    $this->assertDatabaseHas('inventory', [
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
    ]);

    Event::assertDispatched(InventoryAdjusted::class);
});

it('can reserve inventory', function () {
    Event::fake([InventoryReserved::class]);

    // Create initial inventory
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
        'quantity_reserved' => 0,
    ]);

    $action = app(ReserveInventoryAction::class);
    $result = $action->execute($this->product1->id, $this->warehouse1->id, 30);

    expect($result)->toBeTrue();

    $this->assertDatabaseHas('inventory', [
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
        'quantity_reserved' => 30,
    ]);

    Event::assertDispatched(InventoryReserved::class);
});

it('cannot reserve more than available stock', function () {
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 50,
        'quantity_reserved' => 0,
    ]);

    $action = app(ReserveInventoryAction::class);

    expect(fn () => $action->execute($this->product1->id, $this->warehouse1->id, 60))
        ->toThrow(Exception::class, 'Insufficient stock to reserve');
});

it('can release inventory reservation', function () {
    Event::fake([InventoryReservationReleased::class]);

    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
        'quantity_reserved' => 30,
    ]);

    $action = app(ReleaseInventoryReservationAction::class);
    $result = $action->execute($this->product1->id, $this->warehouse1->id, 20);

    expect($result)->toBeTrue();

    $this->assertDatabaseHas('inventory', [
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
        'quantity_reserved' => 10,
    ]);

    Event::assertDispatched(InventoryReservationReleased::class);
});

// ==========================================
// DDT CREATION TESTS
// ==========================================

it('can create ddt in draft status', function () {
    Event::fake([DdtCreated::class]);

    $action = app(CreateDdtAction::class);

    $data = DdtData::from([
        'id' => 1,
        'code' => 'DDT-001',
        'type' => DdtType::Incoming,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-001',
        'ddt_date' => now()->toDateString(),
        'items' => [
            DdtItemData::from([
                'product_id' => $this->product1->id,
                'quantity' => 50,
                'unit' => 'pz',
                'unit_cost' => 10.50,
            ]),
            DdtItemData::from([
                'product_id' => $this->product2->id,
                'quantity' => 30,
                'unit' => 'kg',
                'unit_cost' => 5.25,
            ]),
        ],
    ]);

    $ddt = $action->execute($data);

    expect($ddt)->not->toBeNull()
        ->and($ddt->type)->toBe(DdtType::Incoming)
        ->and($ddt->status)->toBe(DdtStatus::Draft)
        ->and($ddt->ddt_number)->toBe('DDT-001')
        ->and($ddt->items)->toHaveCount(2);

    Event::assertDispatched(DdtCreated::class);
});

// ==========================================
// DDT CONFIRM WORKFLOW TESTS (CRITICAL)
// ==========================================

it('can confirm incoming ddt and dispatch event', function () {
    Event::fake([DdtConfirmed::class, StockMovementCreated::class]);

    // Create DDT in draft
    $ddt = Ddt::create([
        'code' => 'DDT-001',
        'type' => DdtType::Incoming,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-001',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 100,
        'unit' => 'pz',
        'unit_cost' => 10.50,
    ]);

    // Confirm DDT
    $action = app(ConfirmDdtAction::class);
    $confirmedDdt = $action->execute($ddt);

    expect($confirmedDdt->status)->toBe(DdtStatus::Issued);

    Event::assertDispatched(DdtConfirmed::class, function ($event) use ($ddt) {
        return $event->ddt->id === $ddt->id;
    });
});

it('cannot confirm ddt without items', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-002',
        'type' => DdtType::Outgoing,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-002',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    $action = app(ConfirmDdtAction::class);

    expect(fn () => $action->execute($ddt))
        ->toThrow(Exception::class, 'DDT must have at least one item');
});

it('cannot confirm outgoing ddt with insufficient stock', function () {
    // Create inventory with limited stock
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 20,
        'quantity_reserved' => 0,
    ]);

    // Create DDT requesting more stock than available
    $ddt = Ddt::create([
        'code' => 'DDT-003',
        'type' => DdtType::Outgoing,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-003',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 50,
        'unit' => 'pz',
    ]);

    $action = app(ConfirmDdtAction::class);

    expect(fn () => $action->execute($ddt))
        ->toThrow(Exception::class, 'Insufficient stock');
});

it('cannot confirm already confirmed ddt', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-004',
        'type' => DdtType::Incoming,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-004',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Issued,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 50,
        'unit' => 'pz',
    ]);

    $action = app(ConfirmDdtAction::class);

    expect(fn () => $action->execute($ddt))
        ->toThrow(Exception::class, 'Only Draft DDTs can be confirmed');
});

// ==========================================
// DDT CANCEL WORKFLOW TESTS (CRITICAL)
// ==========================================

it('can cancel confirmed ddt', function () {
    Event::fake([DdtCancelled::class]);

    // Create confirmed DDT
    $ddt = Ddt::create([
        'code' => 'DDT-005',
        'type' => DdtType::Incoming,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-005',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Issued,
        'created_by' => $this->user->id,
    ]);

    // Cancel DDT
    $action = app(CancelDdtAction::class);
    $cancelledDdt = $action->execute($ddt, 'Wrong order');

    expect($cancelledDdt->status)->toBe(DdtStatus::Cancelled)
        ->and($cancelledDdt->notes)->toContain('CANCELLED: Wrong order');

    Event::assertDispatched(DdtCancelled::class, function ($event) use ($ddt) {
        return $event->ddt->id === $ddt->id && $event->reason === 'Wrong order';
    });
});

it('cannot cancel draft ddt', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-006',
        'type' => DdtType::Incoming,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-006',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    $action = app(CancelDdtAction::class);

    expect(fn () => $action->execute($ddt, 'Test cancel'))
        ->toThrow(Exception::class, 'DDT cannot be cancelled');
});

// ==========================================
// DDT DELIVER WORKFLOW TESTS
// ==========================================

it('can mark ddt as delivered', function () {
    Event::fake([DdtDelivered::class]);

    $ddt = Ddt::create([
        'code' => 'DDT-007',
        'type' => DdtType::Outgoing,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-007',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Issued,
        'created_by' => $this->user->id,
    ]);

    $action = app(DeliverDdtAction::class);
    $deliveredDdt = $action->execute($ddt);

    expect($deliveredDdt->status)->toBe(DdtStatus::Delivered)
        ->and($deliveredDdt->delivered_at)->not->toBeNull();

    Event::assertDispatched(DdtDelivered::class);
});

// ==========================================
// STOCK MOVEMENT INTEGRATION TESTS
// ==========================================

it('creates stock movements for incoming ddt when confirmed', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-008',
        'type' => DdtType::Incoming,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-008',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 100,
        'unit' => 'pz',
        'unit_cost' => 10.50,
    ]);

    // Confirm DDT - this should trigger GenerateStockMovementsListener
    $action = app(ConfirmDdtAction::class);
    $action->execute($ddt);

    sleep(1);

    // Assert stock movement created
    $this->assertDatabaseHas('stock_movements', [
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'type' => StockMovementType::INTAKE->value,
        'quantity' => 100,
    ]);

    // Assert inventory updated
    $this->assertDatabaseHas('inventory', [
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
    ]);
});

it('creates stock movements for outgoing ddt when confirmed', function () {
    // Create initial inventory
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 200,
        'quantity_reserved' => 0,
    ]);

    $ddt = Ddt::create([
        'code' => 'DDT-009',
        'type' => DdtType::Outgoing,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-009',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 50,
        'unit' => 'pz',
    ]);

    // Confirm DDT
    $action = app(ConfirmDdtAction::class);
    $action->execute($ddt);

    sleep(1);

    // Assert stock movement created
    $this->assertDatabaseHas('stock_movements', [
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'type' => StockMovementType::OUTPUT->value,
        'quantity' => 50,
    ]);

    // Assert inventory decreased
    $inventory = Inventory::where('product_id', $this->product1->id)
        ->where('warehouse_id', $this->warehouse1->id)
        ->first();

    expect($inventory->quantity_available)->toBe('150.00');
});

it('creates stock movements for internal transfer when confirmed', function () {
    // Create initial inventory in warehouse1
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
        'quantity_reserved' => 0,
    ]);

    $ddt = Ddt::create([
        'code' => 'DDT-010',
        'type' => DdtType::Internal,
        'from_warehouse_id' => $this->warehouse1->id,
        'to_warehouse_id' => $this->warehouse2->id,
        'ddt_number' => 'DDT-010',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 30,
        'unit' => 'pz',
    ]);

    // Confirm DDT
    $action = app(ConfirmDdtAction::class);
    $action->execute($ddt);

    sleep(1);

    // Assert 2 stock movements created
    $movements = StockMovement::where('ddt_id', $ddt->id)->get();
    expect($movements)->toHaveCount(2);

    // Assert inventory in warehouse1 decreased
    $inventory1 = Inventory::where('product_id', $this->product1->id)
        ->where('warehouse_id', $this->warehouse1->id)
        ->first();
    expect($inventory1->quantity_available)->toBe('70.00');

    // Assert inventory in warehouse2 increased
    $inventory2 = Inventory::where('product_id', $this->product1->id)
        ->where('warehouse_id', $this->warehouse2->id)
        ->first();
    expect($inventory2->quantity_available)->toBe('30.00');
});

// ==========================================
// REVERSE STOCK MOVEMENTS TESTS
// ==========================================

it('reverses stock movements when ddt is cancelled', function () {
    // Create inventory
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 0,
        'quantity_reserved' => 0,
    ]);

    // Create and confirm incoming DDT
    $ddt = Ddt::create([
        'code' => 'DDT-011',
        'type' => DdtType::Incoming,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-011',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 100,
        'unit' => 'pz',
    ]);

    // Confirm (adds 100 to inventory)
    $confirmAction = app(ConfirmDdtAction::class);
    $confirmAction->execute($ddt);

    sleep(1);

    // Verify inventory increased
    $inventory = Inventory::where('product_id', $this->product1->id)
        ->where('warehouse_id', $this->warehouse1->id)
        ->first();
    expect($inventory->quantity_available)->toBe('100.00');

    // Cancel DDT (should reverse movements and decrease inventory)
    $cancelAction = app(CancelDdtAction::class);
    $cancelAction->execute($ddt->fresh(), 'Order cancelled');

    sleep(1);

    // Verify inventory reversed
    $inventory->refresh();
    expect($inventory->quantity_available)->toBe('0.00');
});

// ==========================================
// API ENDPOINT TESTS
// ==========================================

it('can list inventory via api', function () {
    Inventory::create([
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 100,
        'quantity_reserved' => 0,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/v1/inventory');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'product_id',
                    'warehouse_id',
                    'quantity_available',
                    'quantity_reserved',
                ],
            ],
        ]);
});

it('can adjust inventory via api', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/v1/inventory/adjust', [
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity' => 50,
        'notes' => 'Initial stock',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'Stock adjusted successfully',
        ]);

    $this->assertDatabaseHas('inventory', [
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'quantity_available' => 50,
    ]);
});

it('can list stock movements via api', function () {
    StockMovement::create([
        'code' => 'SM-001',
        'product_id' => $this->product1->id,
        'warehouse_id' => $this->warehouse1->id,
        'type' => StockMovementType::ADJUSTMENT,
        'quantity' => 100,
        'movement_date' => now(),
        'user_id' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->getJson('/api/v1/stock-movements');

    $response->assertOk()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'code',
                    'product_id',
                    'warehouse_id',
                    'type',
                    'quantity',
                ],
            ],
        ]);
});

it('can create ddt via api', function () {
    $response = $this->actingAs($this->user)
        ->postJson('/api/v1/ddts', [
        'type' => DdtType::Incoming->value,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-API-001',
        'ddt_date' => now()->toDateString(),
        'items' => [
            [
                'product_id' => $this->product1->id,
                'quantity' => 50,
                'unit' => 'pz',
                'unit_cost' => 10.50,
            ],
        ],
    ]);

    $response->assertCreated()
        ->assertJson([
            'success' => true,
            'message' => 'DDT created successfully',
        ]);

    $this->assertDatabaseHas('ddts', [
        'type' => DdtType::Incoming->value,
        'ddt_number' => 'DDT-API-001',
        'status' => DdtStatus::Draft->value,
    ]);
});

it('can confirm ddt via api', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-API-002',
        'type' => DdtType::Incoming,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-API-002',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Draft,
        'created_by' => $this->user->id,
    ]);

    DdtItem::create([
        'ddt_id' => $ddt->id,
        'product_id' => $this->product1->id,
        'quantity' => 50,
        'unit' => 'pz',
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/ddts/{$ddt->id}/confirm");

    $response->assertOk()
        ->assertJson([
            'success' => true,
            'message' => 'DDT confirmed and stock movements generated successfully',
        ]);

    $this->assertDatabaseHas('ddts', [
        'id' => $ddt->id,
        'status' => DdtStatus::Issued->value,
    ]);
});

it('can cancel ddt via api', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-API-003',
        'type' => DdtType::Incoming,
        'supplier_id' => $this->supplier->id,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-API-003',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Issued,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/ddts/{$ddt->id}/cancel", [
        'reason' => 'Order cancelled by supplier',
    ]);

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $this->assertDatabaseHas('ddts', [
        'id' => $ddt->id,
        'status' => DdtStatus::Cancelled->value,
    ]);
});

it('can deliver ddt via api', function () {
    $ddt = Ddt::create([
        'code' => 'DDT-API-004',
        'type' => DdtType::Outgoing,
        'from_warehouse_id' => $this->warehouse1->id,
        'ddt_number' => 'DDT-API-004',
        'ddt_date' => now()->toDateString(),
        'status' => DdtStatus::Issued,
        'created_by' => $this->user->id,
    ]);

    $response = $this->actingAs($this->user)
        ->postJson("/api/v1/ddts/{$ddt->id}/deliver");

    $response->assertOk()
        ->assertJson([
            'success' => true,
        ]);

    $this->assertDatabaseHas('ddts', [
        'id' => $ddt->id,
        'status' => DdtStatus::Delivered->value,
    ]);

    $ddt->refresh();
    expect($ddt->delivered_at)->not->toBeNull();
});
