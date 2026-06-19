<?php

namespace App\Http\Controllers\Api\V1\Products;

use App\Actions\Kit\AddItemToKitAssemblyAction;
use App\Actions\Kit\CreateKitAssemblyAction;
use App\Actions\Kit\DisassembleKitAction;
use App\Actions\Kit\RemoveItemFromKitAssemblyAction;
use App\Actions\Kit\UpdateKitAssemblyAction;
use App\Actions\Kit\UpdateKitAssemblyItemAction;
use App\Data\KitAssemblyData;
use App\Data\KitAssemblyItemData;
use App\Domains\Product\Models\Product;
use App\Enums\KitAssemblyStatus;
use App\Http\Controllers\Controller;
use App\Models\KitAssembly;
use App\Models\KitAssemblyItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KitAssemblyController extends Controller
{
    /**
     * GET /products/{product}/kit-assemblies
     */
    public function index(Request $request, Product $product): JsonResponse
    {
        $this->authorize('viewAny', KitAssembly::class);

        $assemblies = KitAssembly::query()
            ->forProduct($product->id)
            ->with(['product', 'items.product', 'assembledBy', 'warehouse'])
            ->when($request->status, fn ($q, $status) => $q->where('status', $status))
            ->when($request->boolean('active_only'), fn ($q) => $q->active())
            ->orderByDesc('assembled_at')
            ->paginate($request->integer('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => KitAssemblyData::collect($assemblies->items()),
            'meta' => [
                'current_page' => $assemblies->currentPage(),
                'total' => $assemblies->total(),
            ],
        ]);
    }

    /**
     * POST /products/{product}/kit-assemblies
     */
    public function store(Request $request, Product $product): JsonResponse
    {
        $this->authorize('create', KitAssembly::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.quantity' => ['required', 'numeric', 'min:0.01'],
            'items.*.serial_number' => ['nullable', 'string', 'max:100'],
            'items.*.notes' => ['nullable', 'string'],
        ]);

        $assembly = app(CreateKitAssemblyAction::class)->execute(
            kitProduct: $product,
            items: $validated['items'],
            warehouseId: $validated['warehouse_id'] ?? null,
            assemblyData: [
                'name' => $validated['name'],
                'warehouse_id' => $validated['warehouse_id'] ?? null,
                'location' => $validated['location'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ],
        );

        return response()->json([
            'success' => true,
            'data' => KitAssemblyData::fromModel($assembly),
        ], 201);
    }

    /**
     * GET /kit-assemblies/{kitAssembly}
     */
    public function show(KitAssembly $kitAssembly): JsonResponse
    {
        $this->authorize('view', $kitAssembly);

        $kitAssembly->load(['product', 'items.product', 'assembledBy', 'disassembledBy', 'warehouse']);

        return response()->json([
            'success' => true,
            'data' => KitAssemblyData::fromModel($kitAssembly),
        ]);
    }

    /**
     * PUT /kit-assemblies/{kitAssembly}
     */
    public function update(Request $request, KitAssembly $kitAssembly): JsonResponse
    {
        $this->authorize('update', $kitAssembly);

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'in:assembled,in_use,returned'],
        ]);

        $assembly = app(UpdateKitAssemblyAction::class)->execute($kitAssembly, $validated);

        return response()->json([
            'success' => true,
            'data' => KitAssemblyData::fromModel($assembly),
        ]);
    }

    /**
     * DELETE /kit-assemblies/{kitAssembly}
     */
    public function destroy(KitAssembly $kitAssembly): JsonResponse
    {
        $this->authorize('delete', $kitAssembly);

        abort_if(
            $kitAssembly->status === KitAssemblyStatus::InUse,
            422,
            'Impossibile eliminare un\'assembly in uso.'
        );

        $kitAssembly->delete();

        return response()->json(['success' => true], 204);
    }

    /**
     * POST /kit-assemblies/{kitAssembly}/disassemble
     */
    public function disassemble(Request $request, KitAssembly $kitAssembly): JsonResponse
    {
        $this->authorize('disassemble', $kitAssembly);

        $validated = $request->validate([
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
        ]);

        $assembly = app(DisassembleKitAction::class)->execute(
            $kitAssembly,
            $validated['warehouse_id'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => KitAssemblyData::fromModel($assembly),
        ]);
    }

    /**
     * POST /kit-assemblies/{kitAssembly}/items
     */
    public function addItem(Request $request, KitAssembly $kitAssembly): JsonResponse
    {
        $this->authorize('manageItems', $kitAssembly);

        $validated = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['required', 'numeric', 'min:0.01'],
            'serial_number' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string'],
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
        ]);

        $item = app(AddItemToKitAssemblyAction::class)->execute(
            assembly: $kitAssembly,
            item: [
                'product_id' => $validated['product_id'],
                'quantity' => $validated['quantity'],
                'serial_number' => $validated['serial_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
            ],
            warehouseId: $validated['warehouse_id'] ?? null,
        );

        return response()->json([
            'success' => true,
            'data' => KitAssemblyItemData::fromModel($item),
        ], 201);
    }

    /**
     * PATCH /kit-assemblies/{kitAssembly}/items/{item}
     */
    public function updateItem(Request $request, KitAssembly $kitAssembly, KitAssemblyItem $item): JsonResponse
    {
        $this->authorize('update', $kitAssembly);

        if ($kitAssembly->status === KitAssemblyStatus::Disassembled) {
            return response()->json(['success' => false, 'message' => 'Assembly disassembled'], 422);
        }

        $validated = $request->validate([
            'quantity' => ['sometimes', 'numeric', 'min:0.01'],
            'serial_number' => ['sometimes', 'nullable', 'string', 'max:100'],
            'notes' => ['sometimes', 'nullable', 'string'],
        ]);

        $item = app(UpdateKitAssemblyItemAction::class)->execute($kitAssembly, $item, $validated);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $item->id,
                'product_id' => $item->product_id,
                'product' => $item->product ? [
                    'id' => $item->product->id,
                    'name' => $item->product->name,
                    'code' => $item->product->code,
                ] : null,
                'quantity' => $item->quantity,
                'serial_number' => $item->serial_number,
                'notes' => $item->notes,
            ],
        ]);
    }

    /**
     * DELETE /kit-assemblies/{kitAssembly}/items/{item}
     */
    public function removeItem(Request $request, KitAssembly $kitAssembly, KitAssemblyItem $item): JsonResponse
    {
        $this->authorize('manageItems', $kitAssembly);

        $validated = $request->validate([
            'warehouse_id' => ['nullable', 'integer', 'exists:warehouses,id'],
        ]);

        app(RemoveItemFromKitAssemblyAction::class)->execute(
            assembly: $kitAssembly,
            item: $item,
            warehouseId: $validated['warehouse_id'] ?? null,
        );

        return response()->json(['success' => true], 204);
    }
}
