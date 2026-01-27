'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Package, Warehouse, Eye, EyeOff } from 'lucide-react';
import type { Product, ProductRelation } from '@/lib/types';

interface ProductListsPreviewProps {
  product: Product;
}

interface PreviewItem {
  product: Product;
  relation: ProductRelation | null;
  quantity: number;
  level: number;
  isOptional: boolean;
}

export function ProductListsPreview({ product }: ProductListsPreviewProps) {
  const [baseQuantity, setBaseQuantity] = useState<number>(1);

  // Fetch and calculate lists preview
  const { data: previewData, isLoading } = useQuery({
    queryKey: ['product-lists-preview', product.id, baseQuantity],
    queryFn: () => generateListsPreview(product, baseQuantity),
    enabled: !!product.id,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Preview Liste
          </CardTitle>
          <CardDescription>Simulazione output nelle 3 liste</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-400">Generazione preview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Preview Liste
            </CardTitle>
            <CardDescription>
              Visualizza come questo prodotto apparirà nelle diverse liste
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Quantity Control */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
          <div className="flex-1 max-w-xs space-y-2">
            <Label htmlFor="previewBaseQuantity">Quantità Simulazione</Label>
            <div className="flex items-center gap-2">
              <Input
                id="previewBaseQuantity"
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

        {/* Tabs for 3 Lists */}
        <Tabs defaultValue="quote" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quote" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Preventivo
              <Badge variant="secondary" className="ml-1">
                {previewData?.quoteList.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="material" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Lista Materiale
              <Badge variant="secondary" className="ml-1">
                {previewData?.materialList.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="stock" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Stock Count
              <Badge variant="secondary" className="ml-1">
                {previewData?.stockList.length || 0}
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Quote List Preview */}
          <TabsContent value="quote" className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                Preventivo per Cliente
              </h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Questa lista mostra i prodotti visibili nel preventivo. I prodotti opzionali richiedono conferma del cliente.
              </p>
            </div>

            {previewData && previewData.quoteList.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <ListPreviewTable items={previewData.quoteList} type="quote" />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun prodotto visibile in preventivo</p>
                <p className="text-xs mt-2">Configura le relazioni per includere prodotti</p>
              </div>
            )}
          </TabsContent>

          {/* Material List Preview */}
          <TabsContent value="material" className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <h4 className="text-sm font-medium text-green-900 dark:text-green-100 mb-2">
                Lista Materiale per Cantiere
              </h4>
              <p className="text-xs text-green-700 dark:text-green-300">
                Lista completa dei materiali da portare in cantiere. Usata dai collaboratori per preparare il lavoro.
              </p>
            </div>

            {previewData && previewData.materialList.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <ListPreviewTable items={previewData.materialList} type="material" />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun prodotto nella lista materiale</p>
                <p className="text-xs mt-2">Configura le relazioni per includere prodotti</p>
              </div>
            )}
          </TabsContent>

          {/* Stock Count Preview */}
          <TabsContent value="stock" className="space-y-4">
            <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="text-sm font-medium text-purple-900 dark:text-purple-100 mb-2">
                Stock Count per Magazzino
              </h4>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                Lista prodotti da scaricare/caricare dal magazzino. Usata per tracking inventario e calcoli costi.
              </p>
            </div>

            {previewData && previewData.stockList.length > 0 ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <ListPreviewTable items={previewData.stockList} type="stock" />
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                <EyeOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nessun prodotto nello stock count</p>
                <p className="text-xs mt-2">Configura le relazioni per includere prodotti</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Legenda:</p>
          <div className="flex flex-wrap gap-3 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-100 dark:bg-blue-900 border-2 border-blue-300 dark:border-blue-700 rounded"></div>
              <span className="text-slate-600 dark:text-slate-400">Prodotto Principale</span>
            </div>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">Opzionale</Badge>
              <span className="text-slate-600 dark:text-slate-400">Richiede Conferma Cliente</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Sub-component for list table
interface ListPreviewTableProps {
  items: PreviewItem[];
  type: 'quote' | 'material' | 'stock';
}

function ListPreviewTable({ items, type }: ListPreviewTableProps) {
  return (
    <>
      <div className="bg-slate-50 dark:bg-slate-900 px-4 py-2 grid grid-cols-4 gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
        <div className="col-span-2">Prodotto</div>
        <div className="text-right">Quantità</div>
        <div className="text-right">Info</div>
      </div>

      <div className="divide-y divide-slate-200 dark:divide-slate-800">
        {items.map((item, index) => (
          <div
            key={index}
            className="px-4 py-3 grid grid-cols-4 gap-4 text-sm hover:bg-slate-50 dark:hover:bg-slate-900"
            style={{ paddingLeft: `${16 + item.level * 16}px` }}
          >
            <div className="col-span-2 flex items-center gap-2">
              {item.level > 0 && (
                <span className="text-xs text-slate-400">└─</span>
              )}
              {item.level === 0 && (
                <div className="w-1 h-full bg-blue-400 rounded-full mr-1"></div>
              )}
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {item.product.name}
              </span>
              <Badge variant="outline" className="text-xs">
                {item.product.code}
              </Badge>
            </div>
            <div className="text-right text-slate-600 dark:text-slate-400">
              {item.quantity.toFixed(2)} {item.product.unit}
            </div>
            <div className="text-right">
              {item.isOptional && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  Opzionale
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

// Helper function to generate lists preview
async function generateListsPreview(
  product: Product,
  baseQuantity: number
): Promise<{
  quoteList: PreviewItem[];
  materialList: PreviewItem[];
  stockList: PreviewItem[];
}> {
  const quoteList: PreviewItem[] = [];
  const materialList: PreviewItem[] = [];
  const stockList: PreviewItem[] = [];

  // Add root product to all lists
  const rootItem: PreviewItem = {
    product,
    relation: null,
    quantity: baseQuantity,
    level: 0,
    isOptional: false,
  };

  quoteList.push(rootItem);
  materialList.push(rootItem);
  stockList.push(rootItem);

  // Fetch and process relations recursively
  await processRelationsForLists(
    product.id!,
    baseQuantity,
    0,
    quoteList,
    materialList,
    stockList,
    new Set()
  );

  return { quoteList, materialList, stockList };
}

async function processRelationsForLists(
  productId: number,
  parentQuantity: number,
  level: number,
  quoteList: PreviewItem[],
  materialList: PreviewItem[],
  stockList: PreviewItem[],
  visited: Set<number>,
  maxDepth: number = 5
): Promise<void> {
  if (level >= maxDepth || visited.has(productId)) {
    return;
  }

  visited.add(productId);

  try {
    const relations = await productsApi.getRelations(productId);

    for (const relation of relations) {
      const relatedProduct = await productsApi.getById(relation.related_product_id);
      const quantity = calculateQuantityForPreview(relation, parentQuantity);

      const item: PreviewItem = {
        product: relatedProduct,
        relation,
        quantity,
        level: level + 1,
        isOptional: relation.is_optional || false,
      };

      // Check trigger conditions
      const shouldInclude = checkTriggerConditions(relation, parentQuantity);

      if (!shouldInclude) {
        continue; // Skip if trigger conditions not met
      }

      // Add to quote list if visible_in_quote
      if (relation.is_visible_in_quote) {
        quoteList.push(item);
      }

      // Add to material list if visible_in_material_list
      if (relation.is_visible_in_material_list ?? true) {
        materialList.push(item);
      }

      // Add to stock list if required_for_stock
      if (relation.is_required_for_stock ?? true) {
        stockList.push(item);
      }

      // Process children recursively
      await processRelationsForLists(
        relatedProduct.id!,
        quantity,
        level + 1,
        quoteList,
        materialList,
        stockList,
        new Set(visited)
      );
    }
  } catch (error) {
    console.error('Error processing relations for lists:', error);
  }
}

function checkTriggerConditions(relation: ProductRelation, parentQuantity: number): boolean {
  // Check min trigger
  if (relation.min_quantity_trigger !== null && relation.min_quantity_trigger !== undefined) {
    const minTrigger = parseFloat(relation.min_quantity_trigger.toString());
    if (parentQuantity < minTrigger) {
      return false;
    }
  }

  // Check max trigger
  if (relation.max_quantity_trigger !== null && relation.max_quantity_trigger !== undefined) {
    const maxTrigger = parseFloat(relation.max_quantity_trigger.toString());
    if (parentQuantity > maxTrigger) {
      return false;
    }
  }

  return true;
}

function calculateQuantityForPreview(relation: ProductRelation, parentQuantity: number): number {
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
