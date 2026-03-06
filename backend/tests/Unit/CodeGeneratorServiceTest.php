<?php

use App\Models\Contractor;
use App\Models\Ddt;
use App\Models\Product;
use App\Models\Project;
use App\Models\Quote;
use App\Models\StockMovement;
use App\Models\Supplier;
use App\Models\Worker;
use App\Services\CodeGeneratorService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\SettingSeeder::class);
    $this->service = app(CodeGeneratorService::class);
});

// Quote Tests
test('generates quote code with default prefix and year format', function () {
    $code = $this->service->generate('quote', ['year' => 2026]);

    expect($code)->toMatch('/^PREV-2026-\d{4}$/');
    expect($code)->toBe('PREV-2026-0001');
});

test('generates quote code with sequential numbers in same year', function () {
    Quote::factory()->create(['created_at' => now()]);
    Quote::factory()->create(['created_at' => now()]);

    $code = $this->service->generate('quote', ['year' => now()->year]);

    expect($code)->toBe('PREV-'.now()->year.'-0003');
});

test('uses custom quote prefix from settings', function () {
    DB::table('settings')->updateOrInsert(
        ['key' => 'quotes.code_prefix', 'user_id' => null],
        [
            'value' => 'Q',
            'type' => 'string',
            'group' => 'quotes',
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    // Clear cache
    cache()->forget('setting:global:quotes.code_prefix');

    $code = $this->service->generate('quote', ['year' => 2026]);

    expect($code)->toStartWith('Q-2026-');
});

// Product Tests
test('generates product code with default prefix and format', function () {
    $code = $this->service->generate('product');

    expect($code)->toMatch('/^PRD-\d{5}$/');
    expect($code)->toBe('PRD-00001');
});

test('generates product code with sequential numbers', function () {
    Product::factory()->count(2)->create();

    $code = $this->service->generate('product');

    expect($code)->toBe('PRD-00003');
});

// Supplier Tests
test('generates supplier code with default prefix', function () {
    $code = $this->service->generate('supplier');

    expect($code)->toMatch('/^FOR-\d{5}$/');
    expect($code)->toBe('FOR-00001');
});

test('uses custom supplier prefix from settings', function () {
    DB::table('settings')->updateOrInsert(
        ['key' => 'codes.supplier_prefix', 'user_id' => null],
        [
            'value' => 'SUP',
            'type' => 'string',
            'group' => 'codes',
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    cache()->forget('setting:global:codes.supplier_prefix');

    $code = $this->service->generate('supplier');

    expect($code)->toStartWith('SUP-');
});

// Worker Tests
test('generates worker code with default prefix', function () {
    $code = $this->service->generate('worker');

    expect($code)->toMatch('/^LAV-\d{5}$/');
    expect($code)->toBe('LAV-00001');
});

test('generates worker code with sequential numbers', function () {
    // Create workers manually
    for ($i = 0; $i < 5; $i++) {
        Worker::create([
            'code' => 'LAV-'.str_pad($i + 1, 5, '0', STR_PAD_LEFT),
            'worker_type' => 'employee',
            'contract_type' => 'permanent',
            'first_name' => 'Worker',
            'last_name' => "Test {$i}",
            'email' => "worker{$i}@test.com",
            'phone' => '+39123456789',
        ]);
    }

    $code = $this->service->generate('worker');

    expect($code)->toBe('LAV-00006');
});

// Contractor Tests
test('generates contractor code with default prefix', function () {
    $code = $this->service->generate('contractor');

    expect($code)->toMatch('/^CON-\d{5}$/');
    expect($code)->toBe('CON-00001');
});

test('generates contractor code with sequential numbers', function () {
    // Create contractors manually
    for ($i = 0; $i < 10; $i++) {
        Contractor::create([
            'code' => 'CON-'.str_pad($i + 1, 5, '0', STR_PAD_LEFT),
            'company_name' => "Contractor {$i}",
            'vat_number' => "IT1234567890{$i}",
            'contractor_type' => 'subcontractor',
            'email' => "contractor{$i}@test.com",
            'phone' => '+39123456789',
        ]);
    }

    $code = $this->service->generate('contractor');

    expect($code)->toBe('CON-00011');
});

// DDT Tests
test('generates ddt code with year format', function () {
    $code = $this->service->generate('ddt', ['year' => 2026]);

    expect($code)->toMatch('/^DDT-2026-\d{4}$/');
    expect($code)->toBe('DDT-2026-0001');
});

test('generates ddt code with sequential numbers per year', function () {
    // Create DDTs manually
    $customer = \App\Models\Customer::factory()->create();
    $warehouse = \App\Models\Warehouse::factory()->create();
    $user = \App\Models\User::factory()->create();

    Ddt::create([
        'code' => 'DDT-'.now()->year.'-0001',
        'type' => 'outgoing',
        'customer_id' => $customer->id,
        'from_warehouse_id' => $warehouse->id,
        'ddt_number' => 'DDT001',
        'ddt_date' => now()->startOfYear(),
        'status' => 'draft',
        'created_by' => $user->id,
        'created_at' => now()->startOfYear(),
    ]);

    Ddt::create([
        'code' => 'DDT-'.now()->year.'-0002',
        'type' => 'outgoing',
        'customer_id' => $customer->id,
        'from_warehouse_id' => $warehouse->id,
        'ddt_number' => 'DDT002',
        'ddt_date' => now()->startOfYear()->addMonth(),
        'status' => 'draft',
        'created_by' => $user->id,
        'created_at' => now()->startOfYear()->addMonth(),
    ]);

    $code = $this->service->generate('ddt', ['year' => now()->year]);

    expect($code)->toBe('DDT-'.now()->year.'-0003');
});

// Stock Movement Tests
test('generates movement code with date format', function () {
    $date = now()->format('Ymd');
    $code = $this->service->generate('movement', ['date' => $date]);

    expect($code)->toMatch('/^MOV-\d{8}-\d{3}$/');
    expect($code)->toBe("MOV-{$date}-001");
});

test('generates movement code with sequential numbers per day', function () {
    $product = Product::factory()->create();
    $warehouse = \App\Models\Warehouse::factory()->create();
    $user = \App\Models\User::factory()->create();

    $date = now();

    // Create movements with explicit codes to avoid unique constraint violation
    StockMovement::create([
        'code' => 'MOV-'.$date->format('Ymd').'-001',
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'type' => 'intake',
        'quantity' => 10,
        'movement_date' => $date,
        'user_id' => $user->id,
        'created_at' => $date,
    ]);

    StockMovement::create([
        'code' => 'MOV-'.$date->format('Ymd').'-002',
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'type' => 'intake',
        'quantity' => 5,
        'movement_date' => $date,
        'user_id' => $user->id,
        'created_at' => $date,
    ]);

    $code = $this->service->generate('movement', ['date' => $date->format('Ymd')]);

    expect($code)->toBe('MOV-'.$date->format('Ymd').'-003');
});

// Project Tests
test('generates project code with default prefix', function () {
    $code = $this->service->generate('project');

    expect($code)->toMatch('/^PROG-\d{4}$/');
    expect($code)->toBe('PROG-0001');
});

test('generates project code with sequential numbers', function () {
    Project::factory()->count(3)->create();

    $code = $this->service->generate('project');

    expect($code)->toBe('PROG-0004');
});

// Edge Cases
test('handles unknown entity with default format', function () {
    $code = $this->service->generate('unknown');

    expect($code)->toMatch('/^CODE-\d{4}$/');
    expect($code)->toBe('CODE-0001');
});

test('handles year context correctly for year-based codes', function () {
    Quote::factory()->create(['created_at' => '2025-12-31']);
    Quote::factory()->create(['created_at' => '2026-01-01']);

    $code2025 = $this->service->generate('quote', ['year' => 2025]);
    $code2026 = $this->service->generate('quote', ['year' => 2026]);

    expect($code2025)->toBe('PREV-2025-0002');
    expect($code2026)->toBe('PREV-2026-0002');
});

test('handles date context correctly for date-based codes', function () {
    $product = Product::factory()->create();
    $warehouse = \App\Models\Warehouse::factory()->create();
    $user = \App\Models\User::factory()->create();

    // Use specific dates that won't conflict with other tests
    $date1 = now()->subDays(10)->startOfDay();
    $date2 = now()->subDays(5)->startOfDay();

    // Manually create movements for different dates
    DB::table('stock_movements')->insert([
        'code' => 'MOV-'.$date1->format('Ymd').'-001',
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'type' => 'intake',
        'quantity' => 10,
        'movement_date' => $date1,
        'user_id' => $user->id,
        'created_at' => $date1,
        'updated_at' => $date1,
    ]);

    DB::table('stock_movements')->insert([
        'code' => 'MOV-'.$date2->format('Ymd').'-001',
        'product_id' => $product->id,
        'warehouse_id' => $warehouse->id,
        'type' => 'intake',
        'quantity' => 5,
        'movement_date' => $date2,
        'user_id' => $user->id,
        'created_at' => $date2,
        'updated_at' => $date2,
    ]);

    // Generate codes - should increment based on created_at date
    $code1 = $this->service->generate('movement', ['date' => $date1->format('Ymd')]);
    $code2 = $this->service->generate('movement', ['date' => $date2->format('Ymd')]);

    // Verify that codes include the date and proper numbering
    // Counter resets yearly (not per-date), so with 2 existing movements the next is 003
    expect($code1)->toBe('MOV-'.$date1->format('Ymd').'-003');
    expect($code2)->toBe('MOV-'.$date2->format('Ymd').'-003');
});

// Format Customization Tests
test('respects custom format from settings', function () {
    DB::table('settings')->updateOrInsert(
        ['key' => 'products.code_format', 'user_id' => null],
        [
            'value' => '{prefix}{number:3}',
            'type' => 'string',
            'group' => 'products',
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    cache()->forget('setting:global:products.code_format');

    $code = $this->service->generate('product');

    expect($code)->toBe('PRD001');
});

test('handles different padding in format', function () {
    DB::table('settings')->updateOrInsert(
        ['key' => 'projects.code_format', 'user_id' => null],
        [
            'value' => '{prefix}-{number:6}',
            'type' => 'string',
            'group' => 'projects',
            'created_at' => now(),
            'updated_at' => now(),
        ]
    );

    cache()->forget('setting:global:projects.code_format');

    $code = $this->service->generate('project');

    expect($code)->toBe('PROG-000001');
});
