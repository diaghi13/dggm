<?php

namespace App\Http\Controllers\Api\V1\PriceLists;

use App\Data\PriceListItemData;
use App\Domains\Product\Enums\ProductType;
use App\Domains\Product\Models\Product;
use App\Domains\Product\Services\ProductPricingService;
use App\Http\Controllers\Controller;
use App\Models\PriceList;
use App\Models\PriceListItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PriceListItemController extends Controller
{
    public function __construct(
        private readonly ProductPricingService $pricingService
    ) {}

    /**
     * Get paginated price list items with products
     */
    public function index(Request $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('view', $priceList);

        $perPage = min($request->input('per_page', 100), 500);
        $search = $request->input('search');
        $isActive = $request->input('is_active');
        $isManualPrice = $request->input('is_manual_price');
        $productType = $request->input('product_type');

        $query = $priceList->items()
            ->leftJoin('products', 'price_list_items.product_id', '=', 'products.id')
            ->select('price_list_items.*') // Select only price_list_items columns
            ->with(['product.category', 'product.brand'])
            // Search filter
            ->when($search, function ($q) use ($search) {
                $q->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('products.name', 'like', "%{$search}%")
                        ->orWhere('products.code', 'like', "%{$search}%")
                        ->orWhere('price_list_items.name', 'like', "%{$search}%")
                        ->orWhere('price_list_items.code', 'like', "%{$search}%");
                });
            })
            // Active/Inactive filter
            ->when($isActive !== null, function ($q) use ($isActive) {
                $q->where('price_list_items.is_active', filter_var($isActive, FILTER_VALIDATE_BOOLEAN));
            })
            // Manual/Automatic price filter
            ->when($isManualPrice !== null, function ($q) use ($isManualPrice) {
                $q->where('price_list_items.is_manual_price', filter_var($isManualPrice, FILTER_VALIDATE_BOOLEAN));
            })
            // Product type filter (article, service, composite)
            ->when($productType, function ($q) use ($productType) {
                $q->where('products.product_type', $productType);
            })
            ->orderByRaw('COALESCE(price_list_items.name, products.name) ASC');

        $items = $query->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::collect($items->items(), \Spatie\LaravelData\DataCollection::class),
            'meta' => [
                'current_page' => $items->currentPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
                'last_page' => $items->lastPage(),
            ],
            'links' => [
                'first' => $items->url(1),
                'last' => $items->url($items->lastPage()),
                'prev' => $items->previousPageUrl(),
                'next' => $items->nextPageUrl(),
            ],
        ]);
    }

    /**
     * Add a new item to the price list
     */
    public function store(Request $request, PriceList $priceList): JsonResponse
    {
        $this->authorize('update', $priceList);

        $validated = $request->validate([
            'product_id' => 'nullable|exists:products,id',
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:50',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'sale_price' => 'nullable|numeric|min:0',
            'is_manual_price' => 'nullable|boolean',
            'rental_hourly' => 'nullable|numeric|min:0',
            'rental_half_day' => 'nullable|numeric|min:0',
            'rental_daily' => 'nullable|numeric|min:0',
            'rental_weekly' => 'nullable|numeric|min:0',
            'rental_monthly' => 'nullable|numeric|min:0',
            'rental_seasonal' => 'nullable|numeric|min:0',
            'is_manual_rental' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'item_type' => 'nullable|string|in:article,service,composite,kit',
        ]);

        // Require either product_id OR (name + code)
        if (empty($validated['product_id']) && (empty($validated['name']) || empty($validated['code']))) {
            return response()->json([
                'success' => false,
                'message' => 'Specificare un prodotto oppure nome e codice dell\'elemento.',
                'errors' => ['product_id' => ['Seleziona un prodotto o inserisci nome e codice manualmente.']],
            ], 422);
        }

        $validated['is_manual_price'] = $validated['is_manual_price'] ?? false;
        $validated['is_manual_rental'] = $validated['is_manual_rental'] ?? false;
        $validated['is_active'] = $validated['is_active'] ?? true;

        $product = null;

        if (! empty($validated['product_id'])) {
            $product = Product::findOrFail($validated['product_id']);

            // Check duplicate
            $existing = PriceListItem::where('price_list_id', $priceList->id)
                ->where('product_id', $validated['product_id'])
                ->first();
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'Il prodotto è già presente in questo listino.',
                ], 422);
            }

            // Populate name/code/unit from product (template)
            $validated['name'] = $validated['name'] ?? $product->name;
            $validated['code'] = $validated['code'] ?? $product->code;
            $validated['unit'] = $validated['unit'] ?? ($product->unit ?? null);

            // Populate item_type from product type (template)
            $validated['item_type'] = $product->product_type->value;

            // Auto-calculate price if not manual and no price provided
            if (! $validated['is_manual_price'] && (empty($validated['sale_price']) || $validated['sale_price'] == 0)) {
                $priceData = $priceList->calculation_mode->value === 'automatic'
                    ? $this->pricingService->generateAutomaticPriceListItem($product, $priceList)
                    : $this->pricingService->generateManualPriceListItem($product);

                $validated['sale_price'] = $priceData['sale_price'] ?? 0;

                // Auto-populate rental prices if not manual
                if (! $validated['is_manual_rental']) {
                    $validated['rental_hourly'] = $priceData['rental_hourly'] ?? null;
                    $validated['rental_half_day'] = $priceData['rental_half_day'] ?? null;
                    $validated['rental_daily'] = $priceData['rental_daily'] ?? null;
                    $validated['rental_weekly'] = $priceData['rental_weekly'] ?? null;
                    $validated['rental_monthly'] = $priceData['rental_monthly'] ?? null;
                    $validated['rental_seasonal'] = $priceData['rental_seasonal'] ?? null;
                }
            }

            // Services are not rentable
            if ($product->product_type === ProductType::SERVICE) {
                $validated['rental_hourly'] = null;
                $validated['rental_half_day'] = null;
                $validated['rental_daily'] = null;
                $validated['rental_weekly'] = null;
                $validated['rental_monthly'] = null;
                $validated['rental_seasonal'] = null;
                $validated['is_manual_rental'] = false;
            }
        } else {
            // Manual item without product: check code uniqueness per price list
            $existingCode = PriceListItem::where('price_list_id', $priceList->id)
                ->whereNull('product_id')
                ->where('code', $validated['code'])
                ->first();
            if ($existingCode) {
                return response()->json([
                    'success' => false,
                    'message' => 'Un elemento con questo codice è già presente nel listino.',
                    'errors' => ['code' => ['Codice già esistente in questo listino.']],
                ], 422);
            }
        }

        $validated['sale_price'] = $validated['sale_price'] ?? 0;

        $item = PriceListItem::create([
            'price_list_id' => $priceList->id,
            ...$validated,
        ]);

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::from($item->load('product')),
            'message' => 'Elemento aggiunto al listino con successo.',
        ], 201);
    }

    /**
     * Update an existing item in the price list
     */
    public function update(Request $request, PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Verify item belongs to this price list
        if ($item->price_list_id !== $priceList->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item does not belong to this price list',
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'code' => 'nullable|string|max:100',
            'unit' => 'nullable|string|max:50',
            'vat_rate' => 'nullable|numeric|min:0|max:100',
            'sale_price' => 'required|numeric|min:0',
            'is_manual_price' => 'nullable|boolean',
            'rental_hourly' => 'nullable|numeric|min:0',
            'rental_half_day' => 'nullable|numeric|min:0',
            'rental_daily' => 'nullable|numeric|min:0',
            'rental_weekly' => 'nullable|numeric|min:0',
            'rental_monthly' => 'nullable|numeric|min:0',
            'rental_seasonal' => 'nullable|numeric|min:0',
            'is_manual_rental' => 'nullable|boolean',
            'is_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'item_type' => 'nullable|string|in:article,service,composite,kit',
        ]);

        // Set defaults for NOT NULL boolean fields to prevent constraint violations
        $validated['is_manual_price'] = $validated['is_manual_price'] ?? $item->is_manual_price;
        $validated['is_manual_rental'] = $validated['is_manual_rental'] ?? $item->is_manual_rental;
        $validated['is_active'] = $validated['is_active'] ?? $item->is_active;

        // Capture is_manual_rental before update (may change in $validated)
        $wasManualRental = (bool) $validated['is_manual_rental'];

        $item->update($validated);

        // Force rental fields to null for SERVICE products regardless of manual flag
        $item->loadMissing('product');
        if ($item->product && $item->product->product_type === ProductType::SERVICE) {
            $item->update([
                'rental_hourly' => null,
                'rental_half_day' => null,
                'rental_daily' => null,
                'rental_weekly' => null,
                'rental_monthly' => null,
                'rental_seasonal' => null,
            ]);
        } elseif ($item->product && ! $wasManualRental && isset($validated['sale_price'])) {
            // Ricalcola rental se non manuale e sale_price è cambiato
            $item->loadMissing('priceList');
            $itemData = $item->priceList->calculation_mode->value === 'automatic'
                ? $this->pricingService->generateAutomaticPriceListItem($item->product, $item->priceList)
                : $this->pricingService->generateManualPriceListItem($item->product);

            $item->update([
                'rental_hourly' => $itemData['rental_hourly'],
                'rental_half_day' => $itemData['rental_half_day'],
                'rental_daily' => $itemData['rental_daily'],
                'rental_weekly' => $itemData['rental_weekly'],
                'rental_monthly' => $itemData['rental_monthly'],
                'rental_seasonal' => $itemData['rental_seasonal'],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::from($item->fresh('product')),
            'message' => 'Price list item updated successfully',
        ]);
    }

    /**
     * Remove an item from the price list
     */
    public function destroy(PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Verify item belongs to this price list
        if ($item->price_list_id !== $priceList->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item does not belong to this price list',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item removed from price list successfully',
        ]);
    }

    /**
     * Recalculate item price based on price list settings
     */
    public function recalculate(PriceList $priceList, PriceListItem $item): JsonResponse
    {
        $this->authorize('update', $priceList);

        // Verify item belongs to this price list
        if ($item->price_list_id !== $priceList->id) {
            return response()->json([
                'success' => false,
                'message' => 'Item does not belong to this price list',
            ], 404);
        }

        if (! $item->product_id) {
            return response()->json([
                'success' => false,
                'message' => 'Non è possibile ricalcolare un elemento senza prodotto.',
            ], 422);
        }

        $product = Product::findOrFail($item->product_id);

        // Regenerate prices based on price list mode
        $itemData = $priceList->calculation_mode->value === 'automatic'
            ? $this->pricingService->generateAutomaticPriceListItem($product, $priceList)
            : $this->pricingService->generateManualPriceListItem($product);

        $item->update($itemData);

        return response()->json([
            'success' => true,
            'data' => PriceListItemData::from($item->fresh('product')),
            'message' => 'Item price recalculated successfully',
        ]);
    }
}
