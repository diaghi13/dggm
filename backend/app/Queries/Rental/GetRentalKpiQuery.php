<?php

namespace App\Queries\Rental;

use App\Models\Product;
use App\Models\Setting;
use Illuminate\Support\Facades\DB;

readonly class GetRentalKpiQuery
{
    public function execute(): array
    {
        return [
            'break_even_tracker' => $this->breakEvenTracker(),
            'buy_vs_rent' => $this->buyVsRent(),
            'asset_roi' => $this->assetRoi(),
            'underperformers' => $this->underperformers(),
            'scarcity_monitor' => $this->scarcityMonitor(),
        ];
    }

    private function breakEvenTracker(): array
    {
        $breakEvenDays = (int) Setting::get('rental.break_even_days', 40);

        $products = Product::query()
            ->where('is_rentable', true)
            ->whereIn('ownership_type', ['owned', 'mixed'])
            ->select('id', 'name', 'code')
            ->get();

        if ($products->isEmpty()) {
            return [];
        }

        $productIds = $products->pluck('id');

        // Aggregate rental days per product from approved quote_items
        $rentalDays = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->whereIn('quote_items.product_id', $productIds)
            ->where('quotes.status', 'approved')
            ->whereIn('quote_items.billing_unit', ['day', 'week', 'month', 'hour'])
            ->whereNotNull('quote_items.product_id')
            ->selectRaw("
                quote_items.product_id,
                SUM(
                    CASE quote_items.billing_unit
                        WHEN 'day'   THEN quote_items.duration * quote_items.quantity
                        WHEN 'week'  THEN quote_items.duration * quote_items.quantity * 7
                        WHEN 'month' THEN quote_items.duration * quote_items.quantity * 30
                        WHEN 'hour'  THEN quote_items.duration * quote_items.quantity / 8
                        ELSE 0
                    END
                ) as total_rented_days
            ")
            ->groupBy('quote_items.product_id')
            ->get()
            ->keyBy('product_id');

        return $products->map(function (Product $product) use ($rentalDays, $breakEvenDays) {
            $totalRentedDays = (float) ($rentalDays->get($product->id)?->total_rented_days ?? 0);
            $progress = $breakEvenDays > 0
                ? min(100, round(($totalRentedDays / $breakEvenDays) * 100, 2))
                : 0;

            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'total_rented_days' => round($totalRentedDays, 2),
                'break_even_days' => $breakEvenDays,
                'progress' => $progress,
                'remaining_days' => max(0, round($breakEvenDays - $totalRentedDays, 2)),
            ];
        })->values()->all();
    }

    private function buyVsRent(): array
    {
        $products = Product::query()
            ->where('is_rentable', true)
            ->whereIn('ownership_type', ['subrental', 'mixed'])
            ->select('id', 'name', 'code', 'standard_cost')
            ->get();

        if ($products->isEmpty()) {
            return [];
        }

        $productIds = $products->pluck('id');
        $oneYearAgo = now()->subDays(365)->toDateString();

        $annualCosts = DB::table('subrental_cost_history')
            ->whereIn('product_id', $productIds)
            ->where('date', '>=', $oneYearAgo)
            ->selectRaw('product_id, SUM(actual_cost) as annual_subrental_cost')
            ->groupBy('product_id')
            ->get()
            ->keyBy('product_id');

        return $products->map(function (Product $product) use ($annualCosts) {
            $annualCost = (float) ($annualCosts->get($product->id)?->annual_subrental_cost ?? 0);
            $purchasePrice = (float) ($product->standard_cost ?? 0);

            if ($purchasePrice <= 0) {
                $ratio = null;
                $trafficLight = 'red';
            } else {
                $ratio = round($annualCost / $purchasePrice, 4);
                $trafficLight = match (true) {
                    $ratio < 0.30 => 'green',
                    $ratio <= 0.60 => 'yellow',
                    default => 'red',
                };
            }

            return [
                'product_id' => $product->id,
                'name' => $product->name,
                'code' => $product->code,
                'annual_subrental_cost' => round($annualCost, 2),
                'estimated_purchase_price' => round($purchasePrice, 2),
                'ratio' => $ratio,
                'traffic_light' => $trafficLight,
            ];
        })->values()->all();
    }

    private function assetRoi(): array
    {
        $rows = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->join('products', 'products.id', '=', 'quote_items.product_id')
            ->where('quotes.status', 'approved')
            ->where('products.is_rentable', true)
            ->whereNotNull('quote_items.product_id')
            ->whereIn('quote_items.billing_unit', ['day', 'week', 'month', 'hour', 'flat'])
            ->selectRaw("
                quote_items.product_id,
                products.name,
                products.code,
                SUM(quote_items.total) as total_revenue,
                COUNT(DISTINCT quote_items.quote_id) as rental_count,
                SUM(
                    CASE quote_items.billing_unit
                        WHEN 'day'   THEN quote_items.duration * quote_items.quantity
                        WHEN 'week'  THEN quote_items.duration * quote_items.quantity * 7
                        WHEN 'month' THEN quote_items.duration * quote_items.quantity * 30
                        WHEN 'hour'  THEN quote_items.duration * quote_items.quantity / 8
                        WHEN 'flat'  THEN quote_items.quantity
                        ELSE quote_items.quantity
                    END
                ) as total_days
            ")
            ->groupBy('quote_items.product_id', 'products.name', 'products.code')
            ->having('rental_count', '>', 0)
            ->get();

        return $rows->map(function (object $row) {
            $totalDays = max((float) $row->total_days, 1);
            $rentalCount = (int) $row->rental_count;
            $totalRevenue = (float) $row->total_revenue;

            return [
                'product_id' => $row->product_id,
                'name' => $row->name,
                'code' => $row->code,
                'total_revenue' => round($totalRevenue, 2),
                'rental_count' => $rentalCount,
                'total_days' => round((float) $row->total_days, 2),
                'avg_duration' => $rentalCount > 0 ? round($totalDays / $rentalCount, 2) : 0,
                'revenue_per_day' => round($totalRevenue / $totalDays, 2),
            ];
        })->values()->all();
    }

    private function underperformers(): array
    {
        $thresholdDays = 30;
        $since = now()->subDays($thresholdDays)->toDateString();

        $products = Product::query()
            ->where('is_rentable', true)
            ->select('id', 'name', 'code')
            ->get();

        if ($products->isEmpty()) {
            return [];
        }

        $productIds = $products->pluck('id');

        // Products with at least one approved rental in threshold window
        $activeProductIds = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->whereIn('quote_items.product_id', $productIds)
            ->where('quotes.status', 'approved')
            ->where('quote_items.created_at', '>=', $since)
            ->whereNotNull('quote_items.product_id')
            ->pluck('quote_items.product_id')
            ->unique();

        // Last rental date per product (across all time)
        $lastRentals = DB::table('quote_items')
            ->join('quotes', 'quotes.id', '=', 'quote_items.quote_id')
            ->whereIn('quote_items.product_id', $productIds)
            ->where('quotes.status', 'approved')
            ->whereNotNull('quote_items.product_id')
            ->selectRaw('quote_items.product_id, MAX(quote_items.created_at) as last_rental_date')
            ->groupBy('quote_items.product_id')
            ->get()
            ->keyBy('product_id');

        return $products
            ->filter(fn (Product $p) => ! $activeProductIds->contains($p->id))
            ->map(function (Product $product) use ($lastRentals) {
                $lastRentalDate = $lastRentals->get($product->id)?->last_rental_date;
                $daysSince = $lastRentalDate
                    ? (int) now()->diffInDays($lastRentalDate)
                    : null;

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'last_rental_date' => $lastRentalDate ? substr($lastRentalDate, 0, 10) : null,
                    'days_since_rental' => $daysSince,
                ];
            })
            ->values()
            ->all();
    }

    private function scarcityMonitor(): array
    {
        $scarcityThreshold = (float) Setting::get('rental.scarcity_threshold', 0.30);
        $scarcityMultiplier = (float) Setting::get('rental.scarcity_multiplier', 1.10);

        $products = Product::query()
            ->where('is_rentable', true)
            ->whereIn('ownership_type', ['owned', 'mixed'])
            ->select('id', 'name', 'code', 'quantity_out_on_rental')
            ->with('inventory')
            ->get();

        if ($products->isEmpty()) {
            return [];
        }

        $approachingLimit = $scarcityThreshold * 2;

        return $products
            ->map(function (Product $product) use ($scarcityThreshold, $scarcityMultiplier) {
                $totalStock = $product->total_stock;
                $availableStock = $product->available_stock;
                $quantityOut = (float) $product->quantity_out_on_rental;
                $safeDenominator = max($totalStock, 1);
                $availabilityRatio = round($availableStock / $safeDenominator, 4);

                return [
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'code' => $product->code,
                    'total_stock' => round($totalStock, 2),
                    'available_stock' => round($availableStock, 2),
                    'quantity_out_on_rental' => round($quantityOut, 2),
                    'availability_ratio' => $availabilityRatio,
                    'is_scarce' => $availabilityRatio <= $scarcityThreshold,
                    'scarcity_multiplier' => $scarcityMultiplier,
                ];
            })
            ->filter(fn (array $item) => $item['availability_ratio'] <= $scarcityThreshold * 2)
            ->values()
            ->all();
    }
}
