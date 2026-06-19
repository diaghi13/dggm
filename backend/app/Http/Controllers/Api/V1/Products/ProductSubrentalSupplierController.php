<?php

namespace App\Http\Controllers\Api\V1\Products;

use App\Domains\Product\Data\ProductSubrentalSupplierData;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Models\ProductSubrentalSupplier;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductSubrentalSupplierController extends Controller
{
    public function index(Product $product): JsonResponse
    {
        $this->authorize('view', $product);

        $suppliers = $product->subrentalSuppliers()
            ->with('supplier')
            ->orderByDesc('is_preferred')
            ->orderByDesc('reliability_score')
            ->get();

        return response()->json([
            'success' => true,
            'data' => ProductSubrentalSupplierData::collect($suppliers),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $this->authorize('update', $product);

        $data = ProductSubrentalSupplierData::from([
            ...$request->all(),
            'product_id' => $product->id,
        ]);

        $supplier = $product->subrentalSuppliers()->create($data->except('id', 'product', 'supplier')->toArray());
        $supplier->load('supplier');

        return response()->json([
            'success' => true,
            'data' => ProductSubrentalSupplierData::from($supplier),
        ], 201);
    }

    public function update(Request $request, Product $product, ProductSubrentalSupplier $subrentalSupplier): JsonResponse
    {
        $this->authorize('update', $product);

        abort_if($subrentalSupplier->product_id !== $product->id, 404);

        $data = ProductSubrentalSupplierData::from([
            ...$request->all(),
            'product_id' => $product->id,
        ]);

        // If setting as preferred, unset others first
        if ($data->is_preferred) {
            $product->subrentalSuppliers()
                ->where('id', '!=', $subrentalSupplier->id)
                ->update(['is_preferred' => false]);
        }

        $subrentalSupplier->update($data->except('id', 'product', 'supplier')->toArray());
        $subrentalSupplier->load('supplier');

        return response()->json([
            'success' => true,
            'data' => ProductSubrentalSupplierData::from($subrentalSupplier),
        ]);
    }

    public function destroy(Product $product, ProductSubrentalSupplier $subrentalSupplier): JsonResponse
    {
        $this->authorize('update', $product);

        abort_if($subrentalSupplier->product_id !== $product->id, 404);

        $subrentalSupplier->delete();

        return response()->json(['success' => true], 200);
    }
}
