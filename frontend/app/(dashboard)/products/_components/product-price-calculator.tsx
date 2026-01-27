'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { Product, ProductRelation } from '@/lib/types';

interface ProductPriceCalculatorProps {
  product: Product;
}

interface PriceBreakdown {
  relatedProduct: Product;
  relation: ProductRelation;
  quantity: number;
  unitCost: number;
  totalCost: number;
  level: number;
}

export function ProductPriceCalculator({ product }: ProductPriceCalculatorProps) {
  const [baseQuantity, setBaseQuantity] = useState<number>(1);
  const [manualPrice, setManualPrice] = useState<string>(product.standard_cost?.toString() || '');
  const [useManualPrice, setUseManualPrice] = useState<boolean>(false);

  // Fetch relations and calculate price
  const { data: priceData, isLoading, refetch } = useQuery({
    queryKey: ['product-price-calculation', product.id, baseQuantity],
    queryFn: () => calculatePriceBreakdown(product.id!, baseQuantity),
    enabled: !!product.id,
  });

  const calculatedPrice = priceData?.totalCost || 0;
  const finalPrice = useManualPrice ? parseFloat(manualPrice) || 0 : calculatedPrice;
  const hasRelations = priceData && priceData.breakdown.length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Calcolo Prezzo Automatico
            </CardTitle>
            <CardDescription>
              Prezzo calcolato automaticamente dalle relazioni del prodotto
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Ricalcola
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Quantity Control */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex-1 max-w-xs space-y-2">
            <Label htmlFor="priceBaseQuantity">Quantità per Calcolo</Label>
            <div className="flex items-center gap-2">
              <Input
                id="priceBaseQuantity"
                type="number"
                min="1"
                step="1"
                value={baseQuantity}
                onChange={(e) => setBaseQuantity(parseInt(e.target.value) || 1)}
                className="w-32"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">× {product.unit}</span>
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Calcolo in corso...</p>
            </div>
          </div>
        )}

        {!isLoading && !hasRelations && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Questo prodotto non ha relazioni configurate. Il prezzo non può essere calcolato automaticamente.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && hasRelations && priceData && (
          <>
            {/* Price Breakdown Table */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Breakdown Costi</Label>
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 grid grid-cols-5 gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                  <div className="col-span-2">Prodotto</div>
                  <div className="text-right">Quantità</div>
                  <div className="text-right">Costo Unit.</div>
                  <div className="text-right">Totale</div>
                </div>

                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {priceData.breakdown.map((item, index) => (
                    <div
                      key={index}
                      className="px-4 py-3 grid grid-cols-5 gap-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
                      style={{ paddingLeft: `${16 + item.level * 16}px` }}
                    >
                      <div className="col-span-2 flex items-center gap-2">
                        {item.level > 0 && (
                          <span className="text-xs text-slate-400">└─</span>
                        )}
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {item.relatedProduct.name}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {item.relatedProduct.code}
                        </Badge>
                      </div>
                      <div className="text-right text-slate-600 dark:text-slate-400">
                        {item.quantity.toFixed(2)} {item.relatedProduct.unit}
                      </div>
                      <div className="text-right text-slate-600 dark:text-slate-400">
                        € {item.unitCost.toFixed(2)}
                      </div>
                      <div className="text-right font-medium text-slate-900 dark:text-slate-100">
                        € {item.totalCost.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Separator />

            {/* Total Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Subtotale Componenti</span>
                <span className="font-medium">€ {priceData.totalCost.toFixed(2)}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Quantità Base</span>
                <span className="font-medium">{baseQuantity} {product.unit}</span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">Costo per Unità</span>
                <span className="font-medium">€ {(priceData.totalCost / baseQuantity).toFixed(2)}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">Prezzo Calcolato</span>
                <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  € {calculatedPrice.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Manual Override Section */}
            <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useManualPrice"
                  checked={useManualPrice}
                  onChange={(e) => setUseManualPrice(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-300 dark:border-amber-700"
                />
                <Label htmlFor="useManualPrice" className="cursor-pointer font-medium">
                  Usa Prezzo Manuale (Override)
                </Label>
              </div>

              {useManualPrice && (
                <div className="space-y-2">
                  <Label htmlFor="manualPrice">Prezzo Manuale</Label>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-600 dark:text-slate-400">€</span>
                    <Input
                      id="manualPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={manualPrice}
                      onChange={(e) => setManualPrice(e.target.value)}
                      className="w-40"
                    />
                  </div>
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Attenzione: stai sovrascrivendo il prezzo calcolato automaticamente
                  </p>
                </div>
              )}
            </div>

            {/* Price Comparison */}
            {product.standard_cost && Math.abs(calculatedPrice - parseFloat(product.standard_cost.toString())) > 0.01 && (
              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription className="space-y-1">
                  <p className="font-medium">Differenza con Prezzo Attuale</p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>Attuale: € {parseFloat(product.standard_cost.toString()).toFixed(2)}</span>
                    <span>→</span>
                    <span>Calcolato: € {calculatedPrice.toFixed(2)}</span>
                    <Badge variant={calculatedPrice > parseFloat(product.standard_cost.toString()) ? 'destructive' : 'default'}>
                      {calculatedPrice > parseFloat(product.standard_cost.toString()) ? '+' : ''}
                      € {(calculatedPrice - parseFloat(product.standard_cost.toString())).toFixed(2)}
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  // TODO: Implement save functionality
                  console.log('Save price:', finalPrice);
                }}
                disabled={!useManualPrice && !hasRelations}
              >
                Applica Prezzo Calcolato
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setUseManualPrice(false);
                  setManualPrice(product.standard_cost?.toString() || '');
                }}
              >
                Reset
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Helper function to calculate price breakdown recursively
async function calculatePriceBreakdown(
  productId: number,
  parentQuantity: number,
  level: number = 0,
  visited: Set<number> = new Set(),
  maxDepth: number = 5
): Promise<{ breakdown: PriceBreakdown[]; totalCost: number }> {
  if (level >= maxDepth || visited.has(productId)) {
    return { breakdown: [], totalCost: 0 };
  }

  visited.add(productId);

  try {
    const relations = await productsApi.getRelations(productId);

    if (relations.length === 0) {
      return { breakdown: [], totalCost: 0 };
    }

    const breakdown: PriceBreakdown[] = [];
    let totalCost = 0;

    for (const relation of relations) {
      const relatedProduct = await productsApi.getById(relation.related_product_id);
      const quantity = calculateQuantityForPrice(relation, parentQuantity);
      const unitCost = parseFloat(relatedProduct.standard_cost?.toString() || '0');
      const itemTotalCost = quantity * unitCost;

      breakdown.push({
        relatedProduct,
        relation,
        quantity,
        unitCost,
        totalCost: itemTotalCost,
        level,
      });

      totalCost += itemTotalCost;

      // Recursively calculate children costs
      const childResult = await calculatePriceBreakdown(
        relatedProduct.id!,
        quantity,
        level + 1,
        new Set(visited)
      );

      breakdown.push(...childResult.breakdown);
      totalCost += childResult.totalCost;
    }

    return { breakdown, totalCost };
  } catch (error) {
    console.error('Error calculating price breakdown:', error);
    return { breakdown: [], totalCost: 0 };
  }
}

function calculateQuantityForPrice(relation: ProductRelation, parentQuantity: number): number {
  switch (relation.quantity_type) {
    case 'fixed':
      return parseFloat(relation.quantity_value);

    case 'multiplied':
      return parseFloat(relation.quantity_value) * parentQuantity;

    case 'formula':
      try {
        const fn = new Function(
          'qty',
          'ceil',
          'floor',
          'round',
          'min',
          'max',
          'abs',
          `return ${relation.quantity_value}`
        );
        return fn(
          parentQuantity,
          Math.ceil,
          Math.floor,
          Math.round,
          Math.min,
          Math.max,
          Math.abs
        );
      } catch {
        return 0;
      }

    default:
      return 0;
  }
}
