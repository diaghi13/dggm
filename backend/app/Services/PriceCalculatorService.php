<?php

namespace App\Services;

use App\Enums\ProductType;
use App\Models\Product;
use App\ValueObjects\Money;
use Illuminate\Support\Facades\Log;

/**
 * PriceCalculatorService
 *
 * Service per calcoli complessi di prezzi, sconti, ricarichi, IVA.
 * Contiene logica business per pricing.
 *
 * Usato in:
 * - Quotes (calcolo prezzi preventivi con markup)
 * - Products (calcolo prezzo vendita da costo)
 * - Invoices (calcolo totali con IVA e sconti)
 * - Orders (calcolo totale ordine)
 */
class PriceCalculatorService
{
    /**
     * Aliquota IVA standard italiana
     */
    public const VAT_RATE_STANDARD = 22.0;

    public const VAT_RATE_REDUCED = 10.0;

    public const VAT_RATE_SUPER_REDUCED = 4.0;

    /**
     * Calcola prezzo con ricarico percentuale
     *
     * Esempio: cost=100, markup=50% → 150
     */
    public function calculateMarkup(Money $cost, float $markupPercent): Money
    {
        $factor = 1 + ($markupPercent / 100);

        return $cost->multiply($factor);
    }

    /**
     * Applica sconto percentuale
     *
     * Esempio: price=100, discount=20% → 80
     */
    public function applyDiscount(Money $price, float $discountPercent): Money
    {
        $factor = 1 - ($discountPercent / 100);

        return $price->multiply($factor);
    }

    /**
     * Applica sconto fisso
     */
    public function applyFixedDiscount(Money $price, Money $discountAmount): Money
    {
        return $price->subtract($discountAmount);
    }

    /**
     * Calcola importo IVA
     *
     * Esempio: price=100, vat=22% → 22
     */
    public function calculateVAT(Money $price, float $vatRate = self::VAT_RATE_STANDARD): Money
    {
        $vatAmount = $price->amount * ($vatRate / 100);

        return new Money($vatAmount, $price->currency);
    }

    /**
     * Aggiungi IVA al prezzo
     *
     * Esempio: price=100, vat=22% → 122
     */
    public function addVAT(Money $price, float $vatRate = self::VAT_RATE_STANDARD): Money
    {
        $vat = $this->calculateVAT($price, $vatRate);

        return $price->add($vat);
    }

    /**
     * Rimuovi IVA dal prezzo (scorporo IVA)
     *
     * Esempio: priceWithVAT=122, vat=22% → 100
     */
    public function removeVAT(Money $priceWithVAT, float $vatRate = self::VAT_RATE_STANDARD): Money
    {
        $divisor = 1 + ($vatRate / 100);

        return $priceWithVAT->divide($divisor);
    }

    /**
     * Calcola prezzo finale con tutte le operazioni
     *
     * Esempio di options:
     * [
     *     'markup' => 50.0,           // Ricarico 50%
     *     'discount_percent' => 10.0, // Sconto 10%
     *     'discount_fixed' => Money::EUR(5),
     *     'vat_rate' => 22.0,         // IVA 22%
     *     'add_vat' => true,
     * ]
     */
    public function calculateFinalPrice(Money $baseCost, array $options = []): Money
    {
        $price = $baseCost;

        // 1. Applica ricarico
        if (isset($options['markup']) && $options['markup'] > 0) {
            $price = $this->calculateMarkup($price, $options['markup']);
        }

        // 2. Applica sconto percentuale
        if (isset($options['discount_percent']) && $options['discount_percent'] > 0) {
            $price = $this->applyDiscount($price, $options['discount_percent']);
        }

        // 3. Applica sconto fisso
        if (isset($options['discount_fixed']) && $options['discount_fixed'] instanceof Money) {
            $price = $this->applyFixedDiscount($price, $options['discount_fixed']);
        }

        // 4. Aggiungi IVA (se richiesto)
        if ($options['add_vat'] ?? false) {
            $vatRate = $options['vat_rate'] ?? self::VAT_RATE_STANDARD;
            $price = $this->addVAT($price, $vatRate);
        }

        return $price;
    }

    /**
     * Calcola margine percentuale
     *
     * Margine = ((Prezzo Vendita - Costo) / Prezzo Vendita) * 100
     *
     * Esempio: cost=80, sellPrice=100 → margine=20%
     */
    public function calculateMarginPercent(Money $cost, Money $sellPrice): float
    {
        if ($sellPrice->isZero()) {
            return 0.0;
        }

        $profit = $sellPrice->subtract($cost);

        return ($profit->amount / $sellPrice->amount) * 100;
    }

    /**
     * Calcola markup percentuale (inverso di margine)
     *
     * Markup = ((Prezzo Vendita - Costo) / Costo) * 100
     *
     * Esempio: cost=80, sellPrice=100 → markup=25%
     */
    public function calculateMarkupPercent(Money $cost, Money $sellPrice): float
    {
        if ($cost->isZero()) {
            return 0.0;
        }

        $profit = $sellPrice->subtract($cost);

        return ($profit->amount / $cost->amount) * 100;
    }

    /**
     * Calcola prezzo vendita da costo e margine desiderato
     *
     * Esempio: cost=80, marginPercent=20% → sellPrice=100
     */
    public function calculateSellPriceFromMargin(Money $cost, float $marginPercent): Money
    {
        if ($marginPercent >= 100) {
            throw new \InvalidArgumentException('Margin percent cannot be >= 100%');
        }

        // Prezzo = Costo / (1 - Margine/100)
        $divisor = 1 - ($marginPercent / 100);

        return $cost->divide($divisor);
    }

    /**
     * Calcola totale da array di prezzi
     *
     * @param  Money[]  $prices
     */
    public function calculateTotal(array $prices): Money
    {
        if (empty($prices)) {
            return Money::EUR(0);
        }

        $total = $prices[0];

        for ($i = 1; $i < count($prices); $i++) {
            $total = $total->add($prices[$i]);
        }

        return $total;
    }

    /**
     * Calcola totale con quantità
     *
     * @param  array<array{price: Money, quantity: float}>  $items
     */
    public function calculateTotalWithQuantity(array $items): Money
    {
        if (empty($items)) {
            return Money::EUR(0);
        }

        $total = Money::EUR(0);

        foreach ($items as $item) {
            $lineTotal = $item['price']->multiply($item['quantity']);
            $total = $total->add($lineTotal);
        }

        return $total;
    }

    /**
     * Calcola media ponderata
     *
     * @param  array<array{price: Money, weight: float}>  $items
     */
    public function calculateWeightedAverage(array $items): Money
    {
        if (empty($items)) {
            return Money::EUR(0);
        }

        $totalValue = 0;
        $totalWeight = 0;

        foreach ($items as $item) {
            $totalValue += $item['price']->amount * $item['weight'];
            $totalWeight += $item['weight'];
        }

        if ($totalWeight == 0) {
            return Money::EUR(0);
        }

        return new Money($totalValue / $totalWeight, $items[0]['price']->currency);
    }

    /**
     * Calculate product purchase price from suppliers
     * Uses highest price from active suppliers for safety
     * Falls back to manufacturer cost if no suppliers
     *
     * @param  string  $strategy  'highest' (default), 'lowest', 'weighted_average'
     * @return float Purchase price (net, VAT excluded)
     */
    public function calculateProductPurchasePrice(Product $product, string $strategy = 'highest'): float
    {
        $suppliers = $product->suppliers()
            ->wherePivot('is_active', true)
            ->get();

        if ($suppliers->isEmpty()) {
            return $product->manufacturer_cost_price ?? 0;
        }

        return match ($strategy) {
            'highest' => (float) $suppliers->max('pivot.purchase_price'),
            'lowest' => (float) $suppliers->min('pivot.purchase_price'),
            'weighted_average' => $this->calculateWeightedAverageSupplierPrice($suppliers),
            default => (float) $suppliers->max('pivot.purchase_price'),
        };
    }

    /**
     * Calculate sale price with markup.
     *
     * For SERVICE products markup is only applied to manufacturer_cost_price (a cost basis).
     * standard_cost for services is already the final selling price and is returned as-is.
     * Priority: manufacturer_cost_price + markup → standard_cost (direct) → 0.0 + warning.
     *
     * For ARTICLE/COMPOSITE products the purchase price comes from active supplier prices
     * (or manufacturer_cost_price when no suppliers exist), then markup is applied.
     *
     * @return float Sale price (net, VAT excluded)
     */
    public function calculateProductSalePrice(Product $product): float
    {
        if ($product->product_type === ProductType::SERVICE) {
            // manufacturer_cost_price = cost basis → apply markup to derive the selling price
            if (($product->manufacturer_cost_price ?? 0) > 0) {
                $markup = $product->effective_markup_percent ?? 0;

                return round($product->manufacturer_cost_price * (1 + ($markup / 100)), 2);
            }

            // standard_cost for services = already the final selling price → no markup
            if (($product->standard_cost ?? 0) > 0) {
                return (float) $product->standard_cost;
            }

            Log::warning("SERVICE product #{$product->id} ({$product->code}) has no cost basis for automatic pricing. Set standard_cost or enter price manually.");

            return 0.0;
        }

        $purchasePrice = $this->calculateProductPurchasePrice($product);
        $markup = $product->effective_markup_percent;

        return round($purchasePrice * (1 + ($markup / 100)), 2);
    }

    /**
     * Calculate rental prices from purchase cost
     * Uses the break-even formula in RentalEngineService::calculateEstimatedBaseDay()
     *
     * @param  float  $purchaseCost  Purchase cost (net, VAT excluded)
     * @return array ['hourly' => float, 'half_day' => float, 'daily' => float, 'weekly' => float, 'monthly' => float, 'seasonal' => float]
     */
    public function calculateRentalPrices(float $purchaseCost): array
    {
        return app(RentalEngineService::class)->calculateRentalPrices($purchaseCost);
    }

    /**
     * Apply price list adjustment to base price
     *
     * @param  float  $basePrice  Base price before adjustment (net, VAT excluded)
     * @param  string  $adjustmentType  'percentage', 'fixed', 'none'
     * @param  float|null  $adjustmentValue  Value to apply
     * @return float Adjusted price (net, VAT excluded)
     */
    public function applyPriceListAdjustment(
        float $basePrice,
        string $adjustmentType,
        ?float $adjustmentValue
    ): float {
        if ($adjustmentValue === null || $adjustmentType === 'none') {
            return $basePrice;
        }

        return match ($adjustmentType) {
            'percentage' => round($basePrice * (1 + ($adjustmentValue / 100)), 2),
            'fixed' => round($basePrice + $adjustmentValue, 2),
            'multiplier' => round($basePrice * $adjustmentValue, 2),
            default => $basePrice,
        };
    }

    /**
     * Calculate weighted average supplier price
     * Preferred suppliers have double weight
     *
     * @param  \Illuminate\Support\Collection  $suppliers
     * @return float Weighted average price
     */
    public function calculateWeightedAverageSupplierPrice($suppliers): float
    {
        $totalValue = 0;
        $totalWeight = 0;

        foreach ($suppliers as $supplier) {
            $price = $supplier->pivot->purchase_price;
            $weight = $supplier->pivot->is_preferred_supplier ? 2 : 1;

            $totalValue += $price * $weight;
            $totalWeight += $weight;
        }

        return $totalWeight > 0 ? round($totalValue / $totalWeight, 2) : 0;
    }
}
