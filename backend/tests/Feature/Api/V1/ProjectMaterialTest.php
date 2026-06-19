<?php

use App\Domains\Product\Models\Product;
use App\Domains\Project\Models\Project;
use App\Domains\Project\Models\ProjectMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

use function Pest\Laravel\assertDatabaseHas;

uses(TestCase::class, RefreshDatabase::class);

beforeEach(function () {
    $this->seed(\Database\Seeders\RoleAndPermissionSeeder::class);
    $this->user = User::factory()->create();
    $this->user->assignRole('project-manager');
    Sanctum::actingAs($this->user);
});

it('can list project materials', function () {
    $project = Project::factory()->create();
    $product = Product::factory()->create();
    ProjectMaterial::factory()->create([
        'project_id' => $project->id,
        'product_id' => $product->id,
    ]);

    $response = $this->getJson("/api/v1/projects/{$project->id}/materials");

    $response->assertSuccessful()
        ->assertJsonStructure([
            'success',
            'data' => [
                '*' => [
                    'id',
                    'product_id',
                    'planned_quantity',
                    'used_quantity',
                    'status',
                ],
            ],
        ]);
});

it('can add product to project as extra', function () {
    $project = Project::factory()->create();
    $product = Product::factory()->create();

    $response = $this->postJson("/api/v1/projects/{$project->id}/materials", [
        'product_id' => $product->id,
        'planned_quantity' => 10,
        'planned_unit_cost' => 50.00,
        'extra_reason' => 'Customer requested additional work',
    ]);

    $response->assertSuccessful();

    assertDatabaseHas('project_materials', [
        'project_id' => $project->id,
        'product_id' => $product->id,
        'is_extra' => true,
        'requested_by' => $this->user->id,
        'extra_reason' => 'Customer requested additional work',
    ]);
});

it('auto-detects extras when no quote_item_id is provided', function () {
    $project = Project::factory()->create();
    $product = Product::factory()->create();

    $response = $this->postJson("/api/v1/projects/{$project->id}/materials", [
        'product_id' => $product->id,
        'planned_quantity' => 5,
        'planned_unit_cost' => 30.00,
        // No quote_item_id provided = auto-detected as extra
    ]);

    $response->assertSuccessful();

    assertDatabaseHas('project_materials', [
        'project_id' => $project->id,
        'product_id' => $product->id,
        'is_extra' => true,
        'requested_by' => $this->user->id,
    ]);
});

it('can log material usage', function () {
    $project = Project::factory()->create();
    $product = Product::factory()->create();
    $projectMaterial = ProjectMaterial::factory()->create([
        'project_id' => $project->id,
        'product_id' => $product->id,
        'planned_quantity' => 100,
        'used_quantity' => 0,
    ]);

    $response = $this->postJson("/api/v1/projects/{$project->id}/materials/{$projectMaterial->id}/log-usage", [
        'quantity_used' => 25,
        'actual_unit_cost' => 55.00,
        'notes' => 'First usage batch',
    ]);

    $response->assertSuccessful();

    $projectMaterial->refresh();
    expect((float) $projectMaterial->used_quantity)->toBe(25.0);
    expect((float) $projectMaterial->actual_unit_cost)->toBe(55.0);
    expect($projectMaterial->status->value)->toBe('in_use');
});

it('can retrieve extras with cost summary', function () {
    $project = Project::factory()->create();
    $product1 = Product::factory()->create();
    $product2 = Product::factory()->create();

    // Create one extra material
    ProjectMaterial::factory()->create([
        'project_id' => $project->id,
        'product_id' => $product1->id,
        'is_extra' => true,
        'used_quantity' => 10,
        'actual_unit_cost' => 50.00,
    ]);

    // Create one regular material from quote
    ProjectMaterial::factory()->create([
        'project_id' => $project->id,
        'product_id' => $product2->id,
        'is_extra' => false,
        'used_quantity' => 5,
        'actual_unit_cost' => 30.00,
    ]);

    $response = $this->getJson("/api/v1/projects/{$project->id}/materials/extras");

    $response->assertSuccessful()
        ->assertJson([
            'success' => true,
            'summary' => [
                'total_extras' => 1,
                'total_extra_cost' => 500.00, // 10 * 50
            ],
        ]);
});

it('prevents logging usage beyond planned quantity', function () {
    $project = Project::factory()->create();
    $product = Product::factory()->create();
    $projectMaterial = ProjectMaterial::factory()->create([
        'project_id' => $project->id,
        'product_id' => $product->id,
        'planned_quantity' => 10,
        'used_quantity' => 0,
    ]);

    $response = $this->postJson("/api/v1/projects/{$project->id}/materials/{$projectMaterial->id}/log-usage", [
        'quantity_used' => 15, // More than planned
    ]);

    $response->assertUnprocessable()
        ->assertJsonValidationErrors(['quantity_used']);
});
